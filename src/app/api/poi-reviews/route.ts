import { NextRequest, NextResponse } from 'next/server';
import { neon } from '@neondatabase/serverless';
import { AuthError, hasValidApiKey, verifyFirebaseToken } from '@/lib/firebaseAuth';

// OSM element id as it appears in the R2 POI bundles.
const POI_ID_PATTERN = /^(node|way|relation)\/[0-9]+$/;

const MAX_COMMENT_CHARS = 1500; // mirrors the CHECK constraint
const MAX_COMMENT_WORDS = 250;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

interface ReviewBody {
  poiId?: unknown;
  rating?: unknown;
  comment?: unknown;
  lat?: unknown;
  lon?: unknown;
  category?: unknown;
}

interface ParsedReview {
  poiId: string;
  rating: number;
  comment: string | null;
  lat: number | null;
  lon: number | null;
  category: string | null;
}

function fail(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Resolves the caller, or returns the response to send back. A review always
 * belongs to the verified user - the body never says who wrote it.
 */
async function requireUser(request: NextRequest) {
  try {
    const user = await verifyFirebaseToken(request);
    return { user, response: null as null };
  } catch (error) {
    if (error instanceof AuthError) {
      return { user: null, response: fail(error.message, error.status) };
    }
    return { user: null, response: fail('Unauthorized', 401) };
  }
}

/** Shared body validation for add and update. */
function parseReviewBody(body: ReviewBody): ParsedReview | NextResponse {
  const poiId = typeof body.poiId === 'string' ? body.poiId : '';
  if (!POI_ID_PATTERN.test(poiId)) {
    return fail('poiId is required and must look like node/123', 400);
  }

  if (typeof body.rating !== 'number' || !Number.isInteger(body.rating)) {
    return fail('rating is required and must be a whole number', 400);
  }
  if (body.rating < 1 || body.rating > 5) {
    return fail('rating must be between 1 and 5', 400);
  }

  let comment: string | null = null;
  if (body.comment !== undefined && body.comment !== null) {
    if (typeof body.comment !== 'string') {
      return fail('comment must be a string', 400);
    }
    const trimmed = body.comment.trim();
    if (trimmed) {
      if (trimmed.length > MAX_COMMENT_CHARS) {
        return fail(`comment must be ${MAX_COMMENT_CHARS} characters or fewer`, 400);
      }
      if (wordCount(trimmed) > MAX_COMMENT_WORDS) {
        return fail(`comment must be ${MAX_COMMENT_WORDS} words or fewer`, 400);
      }
      comment = trimmed;
    }
  }

  // Re-anchoring snapshot. Client-supplied, so range-check it - a bad value here
  // would send a future re-anchoring pass to the wrong place.
  const lat = typeof body.lat === 'number' ? body.lat : null;
  const lon = typeof body.lon === 'number' ? body.lon : null;
  if (lat !== null && (lat < -90 || lat > 90)) {
    return fail('lat must be between -90 and 90', 400);
  }
  if (lon !== null && (lon < -180 || lon > 180)) {
    return fail('lon must be between -180 and 180', 400);
  }

  const category =
    typeof body.category === 'string' && body.category.length <= 32 ? body.category : null;

  return { poiId, rating: body.rating, comment, lat, lon, category };
}

/**
 * GET /api/poi-reviews?poiId=node/8237631996&page=1&limit=20
 *
 * Every review on a POI. Reading is public catalogue data, so this takes the
 * shared key like the other read endpoints - no user login needed.
 *
 * poiId is a query parameter rather than a path segment because OSM ids contain
 * a slash: /api/poi-reviews/node/8237631996 would not bind to a [poiId] route.
 */
export async function GET(request: NextRequest) {
  if (!hasValidApiKey(request)) {
    return fail('Unauthorized: Invalid or missing API key', 401);
  }

  try {
    const { searchParams } = new URL(request.url);
    const poiId = searchParams.get('poiId');

    if (!poiId || !POI_ID_PATTERN.test(poiId)) {
      return fail('poiId is required and must look like node/123', 400);
    }

    const page = Math.max(parseInt(searchParams.get('page') || '1'), 1);
    const limit = Math.min(
      Math.max(parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT)), 1),
      MAX_LIMIT
    );
    const offset = (page - 1) * limit;

    const sql = neon(process.env.DATABASE_URL!);

    const [summary] = await sql`
      SELECT
        COUNT(*)::int                   AS count,
        COALESCE(AVG(rating), 0)::float AS average
      FROM poi_reviews
      WHERE poi_id = ${poiId} AND NOT is_hidden
    `;

    const reviews = await sql`
      SELECT user_id, display_name, rating, comment, created_at, updated_at
      FROM poi_reviews
      WHERE poi_id = ${poiId} AND NOT is_hidden
      ORDER BY updated_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    return NextResponse.json({
      success: true,
      data: {
        poiId,
        count: summary.count,
        average: Math.round(summary.average * 10) / 10,
        reviews: reviews.map((row) => ({
          userId: row.user_id,
          displayName: row.display_name,
          rating: row.rating,
          comment: row.comment,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        page: {
          pageNo: page,
          limit,
          hasNext: offset + reviews.length < summary.count,
        },
      },
    });
  } catch (error) {
    console.error('POI review fetch error:', error);
    return fail('Internal server error while fetching reviews', 500);
  }
}

/**
 * POST /api/poi-reviews - add a review. Requires a Firebase ID token.
 *
 * One review per user per POI: the table is keyed on (poi_id, user_id), so a
 * second attempt is refused with 409 rather than silently creating a duplicate
 * or overwriting. Use PUT to change an existing one.
 */
export async function POST(request: NextRequest) {
  const { user, response } = await requireUser(request);
  if (!user) return response;

  try {
    const parsed = parseReviewBody(await request.json());
    if (parsed instanceof NextResponse) return parsed;

    const sql = neon(process.env.DATABASE_URL!);
    const inserted = await sql`
      INSERT INTO poi_reviews (
        poi_id, user_id, rating, comment,
        poi_lat, poi_lon, poi_category, display_name
      ) VALUES (
        ${parsed.poiId}, ${user.uid}, ${parsed.rating}, ${parsed.comment},
        ${parsed.lat}, ${parsed.lon}, ${parsed.category}, ${user.name}
      )
      ON CONFLICT (poi_id, user_id) DO NOTHING
      RETURNING poi_id, user_id, rating, comment, created_at, updated_at
    `;

    if (inserted.length === 0) {
      return fail('You have already reviewed this POI. Use PUT to update it.', 409);
    }

    const row = inserted[0];
    return NextResponse.json(
      {
        success: true,
        data: {
          poiId: row.poi_id,
          userId: row.user_id,
          rating: row.rating,
          comment: row.comment,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('POI review add error:', error);
    return fail('Internal server error while saving the review', 500);
  }
}

/**
 * PUT /api/poi-reviews - change your own review. Requires a Firebase ID token.
 *
 * Matches on (poi_id, uid), so there is no parameter a client could set to
 * reach someone else's row. The position snapshot is left at its original
 * values - it records where the POI was when the review was first written.
 *
 * is_hidden is deliberately not touched: a moderated review must not come back
 * to life because its author edited it.
 */
export async function PUT(request: NextRequest) {
  const { user, response } = await requireUser(request);
  if (!user) return response;

  try {
    const parsed = parseReviewBody(await request.json());
    if (parsed instanceof NextResponse) return parsed;

    const sql = neon(process.env.DATABASE_URL!);
    const updated = await sql`
      UPDATE poi_reviews
         SET rating       = ${parsed.rating},
             comment      = ${parsed.comment},
             display_name = ${user.name},
             updated_at   = NOW()
       WHERE poi_id = ${parsed.poiId} AND user_id = ${user.uid}
      RETURNING poi_id, user_id, rating, comment, created_at, updated_at
    `;

    if (updated.length === 0) {
      return fail('You have no review for this POI yet. Use POST to add one.', 404);
    }

    const row = updated[0];
    return NextResponse.json({
      success: true,
      data: {
        poiId: row.poi_id,
        userId: row.user_id,
        rating: row.rating,
        comment: row.comment,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    });
  } catch (error) {
    console.error('POI review update error:', error);
    return fail('Internal server error while updating the review', 500);
  }
}

/**
 * DELETE /api/poi-reviews?poiId=node/8237631996
 *
 * Removes your own review. Requires a Firebase ID token, and the uid is never
 * read from the request, so a client cannot reach anyone else's row.
 */
export async function DELETE(request: NextRequest) {
  const { user, response } = await requireUser(request);
  if (!user) return response;

  try {
    const { searchParams } = new URL(request.url);
    const poiId = searchParams.get('poiId');

    if (!poiId || !POI_ID_PATTERN.test(poiId)) {
      return fail('poiId is required and must look like node/123', 400);
    }

    const sql = neon(process.env.DATABASE_URL!);
    const deleted = await sql`
      DELETE FROM poi_reviews
      WHERE poi_id = ${poiId} AND user_id = ${user.uid}
      RETURNING poi_id
    `;

    if (deleted.length === 0) {
      return fail('You have no review for this POI', 404);
    }

    return NextResponse.json({ success: true, data: { poiId } });
  } catch (error) {
    console.error('POI review delete error:', error);
    return fail('Internal server error while deleting the review', 500);
  }
}
