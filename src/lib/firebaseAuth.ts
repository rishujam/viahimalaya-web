import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

/**
 * Firebase ID token verification.
 *
 * The shared INTERNAL_API_KEY authenticates the *app* - every install carries
 * the same value and it is extractable from any APK, so it can never establish
 * *who* is calling. Anything that writes data owned by a specific person needs
 * this instead: a JWT signed by Google that the client cannot forge.
 *
 * firebase-admin is deliberately not used - it needs Node APIs that are not
 * available on Cloudflare Workers. jose runs on Web Crypto.
 */

// The JWK form of Google's securetoken keys. (The x509 endpoint returns PEM
// certificates, which createRemoteJWKSet cannot consume.)
const FIREBASE_JWKS_URL = new URL(
  'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
);

// Module scope so fetched keys survive across requests in a warm isolate. jose
// refetches on an unseen `kid` behind its own cooldown, which covers Google's
// roughly daily rotation without a network round trip on every request.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(FIREBASE_JWKS_URL);
  }
  return jwks;
}

export class AuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

export interface AuthedUser {
  /** Firebase UID. Stable for the life of the account, unlike email. */
  uid: string;
  email: string | null;
  name: string | null;
}

/**
 * Resolves the caller from the `Authorization: Bearer <firebase-id-token>`
 * header, or throws AuthError. The returned uid comes from the verified `sub`
 * claim - never read an identity out of the request body.
 */
export async function verifyFirebaseToken(request: Request): Promise<AuthedUser> {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new AuthError('Server auth is not configured', 500);
  }

  const header = request.headers.get('Authorization');
  if (!header || !header.startsWith('Bearer ')) {
    throw new AuthError('Missing bearer token');
  }
  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    throw new AuthError('Missing bearer token');
  }

  let payload: JWTPayload;
  try {
    ({ payload } = await jwtVerify(token, getJwks(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
      algorithms: ['RS256'],
    }));
  } catch {
    // Deliberately opaque. A caller gains nothing from knowing whether the
    // token was expired, malformed, or signed by the wrong key.
    throw new AuthError('Invalid or expired token');
  }

  // jwtVerify already enforced iss/aud/exp/signature. Firebase additionally
  // guarantees a non-empty subject on user tokens; be explicit rather than
  // trusting the shape.
  const uid = typeof payload.sub === 'string' ? payload.sub : '';
  if (!uid) {
    throw new AuthError('Token has no subject');
  }

  return {
    uid,
    email: typeof payload.email === 'string' ? payload.email : null,
    name: typeof payload.name === 'string' ? payload.name : null,
  };
}

/** Shared-key check, for read endpoints that serve public catalogue data. */
export function hasValidApiKey(request: Request): boolean {
  const header = request.headers.get('Authorization');
  return !!header && header === `Bearer ${process.env.INTERNAL_API_KEY}`;
}
