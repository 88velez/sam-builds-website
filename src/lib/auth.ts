/**
 * Auth utilities for admin session management.
 * Uses Web Crypto API for SHA-256 hashing — no external deps.
 */

export const SESSION_COOKIE_NAME = "admin_session";
export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

// Cache for the hashed admin password (computed once at first use)
let _hashedAdminPassword: string | null = null;

/**
 * Hash a password using SHA-256 via the Web Crypto API.
 * Returns a hex-encoded hash string.
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Read the admin password from the environment.
 * `import.meta.env` works at build time and in most SSR contexts; `process.env`
 * is the reliable fallback inside serverless functions at runtime.
 * Login and session verification MUST use this same source so they agree.
 */
export function getAdminPassword(): string | undefined {
  return import.meta.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || undefined;
}

/**
 * Get the SHA-256 hash of the configured ADMIN_PASSWORD.
 * Returns null if no password is configured. Cached after first computation.
 */
async function getExpectedHash(): Promise<string | null> {
  if (_hashedAdminPassword) return _hashedAdminPassword;

  const adminPassword = getAdminPassword();
  if (!adminPassword) return null;

  _hashedAdminPassword = await hashPassword(adminPassword);
  return _hashedAdminPassword;
}

/**
 * Verify a session cookie against the ADMIN_PASSWORD env var.
 * Returns true if the cookie matches the SHA-256 hash of ADMIN_PASSWORD.
 * This is async because it computes the hash on first call (then caches it).
 */
export async function verifySession(cookie: string | undefined): Promise<boolean> {
  if (!cookie) return false;

  const expectedHash = await getExpectedHash();
  if (!expectedHash) {
    console.warn("ADMIN_PASSWORD env var is not set — admin access denied.");
    return false;
  }

  return cookie === expectedHash;
}

/**
 * Get the admin email from env var.
 */
export function getAdminEmail(): string {
  return import.meta.env.ADMIN_EMAIL || "admin@yourbusiness.com";
}
