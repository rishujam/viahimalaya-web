/**
 * Rules for a user-submitted place (custom_pois, migration 008).
 *
 * Everything here is pure - no database, no bucket, no request - so it can be
 * exercised without any of them. The route does the I/O and calls these.
 *
 * Two numbers are mirrored in the Android app and must change together with it:
 * AREA_PADDING_M and MAX_DESCRIPTION_CHARS (TrekArea.kt and CustomPoiRules.kt).
 * The app uses them to stop the user early; the checks here are the ones that
 * count.
 */

export const MAX_DESCRIPTION_CHARS = 300;

/** What a phone is expected to send is under 1 MB. This is the ceiling, not the target. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Photo bytes plus room for the multipart framing and the meta part. */
export const MAX_REQUEST_BYTES = MAX_PHOTO_BYTES + 64 * 1024;

/** The phone shrinks to 1,600 px; anything far beyond that is not from our app. */
export const MAX_PHOTO_EDGE_PX = 8000;

/** Per user, in any rolling 24 hours. */
export const MAX_SUBMISSIONS_PER_DAY = 20;

/**
 * How far outside a trek's bounding box a point may be and still count as being
 * in the trekking area. The box is drawn tight on the trail itself, so a camp
 * 300 m to the side of the westernmost bend would otherwise be refused. 1 km
 * matches the planner's own limit on how far off the trail a camp can be.
 */
export const AREA_PADDING_M = 1000;

/** The PoiCategory values the app renders. Only this list is contractual. */
export const POI_CATEGORIES = [
  'water',
  'hot_spring',
  'waterfall',
  'lake',
  'camp_site',
  'stay',
  'shelter',
  'landmark',
  'water_crossing',
  'other',
] as const;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TERMS_VERSION_PATTERN = /^[0-9A-Za-z._-]{1,32}$/;

export type LocationSource = 'gps' | 'map';

export interface CustomPoiMeta {
  id: string;
  trekId: string;
  lat: number;
  lon: number;
  locationSource: LocationSource;
  /** GPS accuracy in metres. Only ever set for locationSource 'gps'. */
  accuracyM: number | null;
  description: string | null;
  category: string | null;
  termsVersion: string;
}

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Validates the JSON `meta` part of the upload. Says what is wrong, not just that something is. */
export function parseMeta(raw: unknown): ParseResult<CustomPoiMeta> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return { ok: false, error: 'meta must be a JSON object' };
  }
  const body = raw as Record<string, unknown>;

  const id = typeof body.id === 'string' ? body.id : '';
  if (!UUID_PATTERN.test(id)) {
    return { ok: false, error: 'id is required and must be a UUID' };
  }

  const trekId = typeof body.trekId === 'string' ? body.trekId.trim() : '';
  if (!trekId || trekId.length > 255) {
    return { ok: false, error: 'trekId is required' };
  }

  const lat = body.lat;
  const lon = body.lon;
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { ok: false, error: 'lat is required and must be between -90 and 90' };
  }
  if (typeof lon !== 'number' || !Number.isFinite(lon) || lon < -180 || lon > 180) {
    return { ok: false, error: 'lon is required and must be between -180 and 180' };
  }

  if (body.locationSource !== 'gps' && body.locationSource !== 'map') {
    return { ok: false, error: "locationSource must be 'gps' or 'map'" };
  }
  const locationSource: LocationSource = body.locationSource;

  // Accuracy describes a GPS fix, so a hand-placed pin has none even if the
  // phone sent one along.
  let accuracyM: number | null = null;
  if (locationSource === 'gps' && body.accuracyM !== undefined && body.accuracyM !== null) {
    if (typeof body.accuracyM !== 'number' || !Number.isFinite(body.accuracyM) || body.accuracyM < 0) {
      return { ok: false, error: 'accuracyM must be a number of metres, zero or more' };
    }
    accuracyM = body.accuracyM;
  }

  let description: string | null = null;
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      return { ok: false, error: 'description must be a string' };
    }
    // Postgres text cannot hold a NUL, and rejects the whole insert if it sees
    // one - which would surface as a 500 for what is just bad input.
    const cleaned = body.description.replace(/\u0000/g, '').trim();
    if (cleaned.length > MAX_DESCRIPTION_CHARS) {
      return { ok: false, error: `description must be ${MAX_DESCRIPTION_CHARS} characters or fewer` };
    }
    description = cleaned || null;
  }

  let category: string | null = null;
  if (body.category !== undefined && body.category !== null) {
    if (typeof body.category !== 'string' || !(POI_CATEGORIES as readonly string[]).includes(body.category)) {
      return { ok: false, error: 'category is not one of the known categories' };
    }
    category = body.category;
  }

  const termsVersion = typeof body.termsVersion === 'string' ? body.termsVersion : '';
  if (!TERMS_VERSION_PATTERN.test(termsVersion)) {
    return { ok: false, error: 'termsVersion is required' };
  }

  return {
    ok: true,
    value: { id, trekId, lat, lon, locationSource, accuracyM, description, category, termsVersion },
  };
}

/**
 * treks.bounding_box is [minLon, minLat, maxLon, maxLat]. Neon hands arrays of
 * floats back as numbers, but a NUMERIC column would arrive as strings, so
 * coerce and check rather than trust the driver.
 */
export function readBoundingBox(raw: unknown): [number, number, number, number] | null {
  if (!Array.isArray(raw) || raw.length < 4) return null;
  const box = raw.slice(0, 4).map(Number);
  if (!box.every(Number.isFinite)) return null;
  const [minLon, minLat, maxLon, maxLat] = box;
  if (minLon > maxLon || minLat > maxLat) return null;
  return [minLon, minLat, maxLon, maxLat];
}

const METRES_PER_DEGREE_LAT = 111_320;

/** True when the point is inside the box, or within paddingM metres of it. */
export function isInsideTrekArea(
  lat: number,
  lon: number,
  box: readonly [number, number, number, number],
  paddingM: number = AREA_PADDING_M
): boolean {
  const [minLon, minLat, maxLon, maxLat] = box;
  const dLat = paddingM / METRES_PER_DEGREE_LAT;
  // A degree of longitude shrinks with latitude. Clamped so a point near a pole
  // cannot divide by (almost) zero; no trek is anywhere near one.
  const cosLat = Math.max(Math.cos((lat * Math.PI) / 180), 0.01);
  const dLon = paddingM / (METRES_PER_DEGREE_LAT * cosLat);
  return lat >= minLat - dLat && lat <= maxLat + dLat && lon >= minLon - dLon && lon <= maxLon + dLon;
}

export interface CleanJpeg {
  bytes: Uint8Array;
  width: number;
  height: number;
}

/**
 * Checks that the bytes are a JPEG and returns a copy with everything that can
 * carry personal data taken out. Null means "not a usable JPEG".
 *
 * The phone already re-encodes the picture, which drops the camera's EXIF block
 * (and with it the GPS position the photo was taken at). This does not rely on
 * that: a bug in one app version, or a hand-made request, must not put someone's
 * location into a file that may later be shown to other people. It works on the
 * file's segment structure only - it never decodes the picture - so it costs
 * almost nothing on a Worker.
 *
 * Kept: the structural segments, the JFIF header, an ICC colour profile and the
 * Adobe marker. Dropped: every other application segment (EXIF and XMP are APP1,
 * IPTC is APP13, plus the multi-picture and vendor ones) and comments. Anything
 * after the end-of-image marker is cut, which removes a thumbnail or a second
 * image appended to the file.
 */
export function cleanJpeg(input: Uint8Array): CleanJpeg | null {
  if (input.length < 4 || input[0] !== 0xff || input[1] !== 0xd8) return null;

  const kept: Uint8Array[] = [input.subarray(0, 2)];
  let pos = 2;
  let width = 0;
  let height = 0;

  for (;;) {
    // Every header segment is 0xFF, a marker byte, then a two-byte length that
    // counts itself. Extra 0xFF bytes in front of a marker are legal padding.
    if (pos + 1 >= input.length || input[pos] !== 0xff) return null;
    const marker = input[pos + 1];
    if (marker === 0xff) {
      pos += 1;
      continue;
    }
    if (marker === 0xda) break; // start of scan: the picture data follows

    // These carry no length and cannot appear before the scan in a valid file.
    if (marker === 0x00 || marker === 0x01 || marker === 0xd8 || marker === 0xd9) return null;
    if (marker >= 0xd0 && marker <= 0xd7) return null;

    if (pos + 4 > input.length) return null;
    const length = (input[pos + 2] << 8) | input[pos + 3];
    const end = pos + 2 + length;
    if (length < 2 || end > input.length) return null;

    // Frame header: precision, then height, then width.
    if (isFrameHeader(marker)) {
      if (length < 8) return null;
      height = (input[pos + 5] << 8) | input[pos + 6];
      width = (input[pos + 7] << 8) | input[pos + 8];
    }

    if (keepSegment(marker, input, pos, end)) kept.push(input.subarray(pos, end));
    pos = end;
  }

  if (width === 0 || height === 0) return null; // no frame header: not a picture

  // Skip the scan header, then look for the end of image. Picture data never
  // contains an unescaped 0xFF 0xD9, so the first such pair is the real end.
  if (pos + 4 > input.length) return null;
  const scanLength = (input[pos + 2] << 8) | input[pos + 3];
  const scanStart = pos + 2 + scanLength;
  if (scanLength < 2 || scanStart > input.length) return null;

  let end = -1;
  for (let i = input.indexOf(0xff, scanStart); i !== -1 && i + 1 < input.length; i = input.indexOf(0xff, i + 1)) {
    if (input[i + 1] === 0xd9) {
      end = i + 2;
      break;
    }
  }
  if (end === -1) return null; // cut off before the end of the picture

  kept.push(input.subarray(pos, end));

  let total = 0;
  for (const part of kept) total += part.length;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const part of kept) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return { bytes, width, height };
}

/** SOF0-SOF15, except the three markers in that range that are not frame headers. */
function isFrameHeader(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

const ICC_SIGNATURE = [0x49, 0x43, 0x43, 0x5f, 0x50, 0x52, 0x4f, 0x46, 0x49, 0x4c, 0x45, 0x00]; // "ICC_PROFILE\0"

function keepSegment(marker: number, input: Uint8Array, pos: number, end: number): boolean {
  if (marker === 0xfe) return false; // comment
  if (marker < 0xe0 || marker > 0xef) return true; // tables and frame header
  if (marker === 0xe0 || marker === 0xee) return true; // JFIF, Adobe
  if (marker === 0xe2) {
    // APP2 holds the colour profile, but also the multi-picture index and
    // FlashPix data. Keep only the profile - and only if the segment is long
    // enough to hold the signature, so the check never reads into the next one.
    const payload = pos + 4;
    if (end - payload < ICC_SIGNATURE.length) return false;
    return ICC_SIGNATURE.every((byte, i) => input[payload + i] === byte);
  }
  return false;
}
