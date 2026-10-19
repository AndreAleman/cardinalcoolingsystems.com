// Download-link tokens: 32 random bytes, base64url. Only the sha256 is stored, so a database read
// never reveals a working link.

import crypto from "node:crypto"

export function generateDownloadToken(): string {
  return crypto.randomBytes(32).toString("base64url")
}

export function hashDownloadToken(token: string): string {
  return crypto.createHash("sha256").update(token, "utf8").digest("hex")
}

/** Rejects obviously malformed tokens before any DB lookup. */
export function isWellFormedToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token)
}
