import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { AuthError, verifyFirebaseToken } from '@/lib/firebaseAuth';
import {
  AREA_PADDING_M,
  MAX_PHOTO_BYTES,
  MAX_PHOTO_EDGE_PX,
  MAX_REQUEST_BYTES,
  MAX_SUBMISSIONS_PER_DAY,
  cleanJpeg,
  isInsideTrekArea,
  parseMeta,
  readBoundingBox,
} from '@/lib/customPoi';

function fail(error: string, status: number, headers?: HeadersInit) {
  return NextResponse.json({ success: false, error }, { status, headers });
}

/**
 * POST /api/custom-pois - a place a user added from the app.
 *
 * multipart/form-data with two parts:
 *   meta  - JSON: id, trekId, lat, lon, locationSource, accuracyM?, description?,
 *           category?, termsVersion (see parseMeta)
 *   photo - the picture, as a JPEG
 *
 * Requires a Firebase ID token. The row always belongs to the verified user; the
 * body never says who it is from.
 *
 * What the phone should do with each answer - it retries from a local queue, so
 * this is the contract that decides what is worth retrying:
 *
 *   201  stored, pending review         -> done
 *   200  this id was already stored     -> done (a retry of something that landed)
 *   400 404 409 413 415 422             -> this exact request will never work: stop
 *   401                                 -> no valid login right now: try later
 *   429                                 -> daily limit: try later
 *   5xx, or no answer                   -> try later
 *
 * Nothing stored here is shown to anyone. A row is 'pending' until it has been
 * looked at by hand (see migration 008), and the photo sits in a private bucket.
 */
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await verifyFirebaseToken(request);
  } catch (error) {
    if (error instanceof AuthError) return fail(error.message, error.status);
    return fail('Unauthorized', 401);
  }

  try {
    // Refuse an oversized body before reading it. A chunked upload has no
    // length, so the photo size is checked again once the parts are parsed.
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_REQUEST_BYTES) {
      return fail('Request is too large', 413);
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch (error) {
      // The caller only needs to know it was malformed; the parser's own words
      // ("Content-Disposition header in FormData part is missing a name") are
      // what tell us which client got the framing wrong, so they go to the log.
      console.error('Custom POI: could not parse the multipart body:', error instanceof Error ? error.message : error);
      return fail('Request must be multipart/form-data', 400);
    }

    const metaPart = form.get('meta');
    const photo = form.get('photo');
    if (typeof metaPart !== 'string') return fail('meta is required', 400);
    if (!photo || typeof photo === 'string') return fail('photo is required', 400);

    let metaJson: unknown;
    try {
      metaJson = JSON.parse(metaPart);
    } catch {
      return fail('meta must be valid JSON', 400);
    }
    const parsed = parseMeta(metaJson);
    if (!parsed.ok) return fail(parsed.error, 400);
    const meta = parsed.value;

    if (photo.size === 0) return fail('photo is empty', 400);
    if (photo.size > MAX_PHOTO_BYTES) {
      return fail(`photo must be ${MAX_PHOTO_BYTES / (1024 * 1024)} MB or smaller`, 413);
    }
    const jpeg = cleanJpeg(new Uint8Array(await photo.arrayBuffer()));
    if (!jpeg) return fail('photo must be a JPEG', 415);
    if (jpeg.width > MAX_PHOTO_EDGE_PX || jpeg.height > MAX_PHOTO_EDGE_PX) {
      return fail(`photo must be ${MAX_PHOTO_EDGE_PX} px or smaller on each side`, 422);
    }

    const sql = neon(process.env.DATABASE_URL!);

    // The point has to be somewhere this trek goes. The geometry is in R2, not
    // Postgres, so the check is against the stored bounding box plus a margin
    // (AREA_PADDING_M) - coarse, but enough to stop a pin in the wrong country.
    const [trek] = await sql`SELECT bounding_box FROM treks WHERE id = ${meta.trekId}`;
    if (!trek) return fail('Unknown trek', 404);
    const box = readBoundingBox(trek.bounding_box);
    if (!box) {
      console.error('Custom POI: trek has no usable bounding box:', meta.trekId);
      return fail('This trek cannot take submissions yet', 422);
    }
    if (!isInsideTrekArea(meta.lat, meta.lon, box, AREA_PADDING_M)) {
      return fail('That point is outside the trekking area', 422);
    }

    // A retry of something that already landed: answer success without storing
    // it again, and without it counting against the daily limit. Checked before
    // the limit for exactly that reason.
    const [existing] = await sql`SELECT user_id, status FROM custom_pois WHERE id = ${meta.id}`;
    if (existing) {
      if (existing.user_id !== user.uid) return fail('That id is already in use', 409);
      return NextResponse.json({ success: true, data: { id: meta.id, status: existing.status } });
    }

    const [recent] = await sql`
      SELECT COUNT(*)::int AS count
      FROM custom_pois
      WHERE user_id = ${user.uid} AND created_at > NOW() - INTERVAL '24 hours'
    `;
    if (recent.count >= MAX_SUBMISSIONS_PER_DAY) {
      return fail('Daily limit reached. Try again tomorrow.', 429, { 'Retry-After': '3600' });
    }

    const bucket = getCloudflareContext().env.USER_PHOTOS;
    if (!bucket) {
      console.error('Custom POI: the USER_PHOTOS binding is missing - see wrangler.jsonc');
      return fail('Photo storage is not configured', 500);
    }

    // Photo first, row second. If the row insert fails, what is left behind is a
    // private file nobody can see, and the retry overwrites the same key. The
    // other order would leave a row that points at nothing.
    const photoKey = `custom_pois/${meta.id}.jpg`;
    await bucket.put(photoKey, jpeg.bytes, {
      httpMetadata: { contentType: 'image/jpeg' },
      customMetadata: { userId: user.uid, trekId: meta.trekId },
    });

    const inserted = await sql`
      INSERT INTO custom_pois (
        id, user_id, trek_id, category, description,
        lat, lon, location_source, location_accuracy_m,
        photo_key, photo_bytes, terms_version
      ) VALUES (
        ${meta.id}, ${user.uid}, ${meta.trekId}, ${meta.category}, ${meta.description},
        ${meta.lat}, ${meta.lon}, ${meta.locationSource}, ${meta.accuracyM},
        ${photoKey}, ${jpeg.bytes.length}, ${meta.termsVersion}
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id, status
    `;

    // Nothing came back only if the same id landed between the check above and
    // this insert - the same submission delivered twice at once. It is stored,
    // so it is a success.
    const status = inserted[0]?.status ?? 'pending';
    return NextResponse.json(
      { success: true, data: { id: meta.id, status } },
      { status: inserted.length > 0 ? 201 : 200 }
    );
  } catch (error) {
    console.error('Custom POI submit error:', error);

    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      return fail('Custom POI table not found. Run migration 008.', 500);
    }
    return fail('Internal server error while saving the place', 500);
  }
}
