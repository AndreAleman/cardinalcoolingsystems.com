/*
  Pure seam: the anti-abuse rules (bot protection, 2026-09).

  Layers, outermost first: Turnstile challenge → honeypot → per-IP rate
  limit → cap on signup emails to Cardinal. The revenue path (contact
  form) must never go down because a guard's dependency is missing, so
  every guard that needs configuration or Redis FAILS OPEN and logs.
*/

export type RateRule = { limit: number; windowSec: number };

export const RATE_RULES = {
  register: { limit: 5, windowSec: 60 * 60 },
  company: { limit: 3, windowSec: 60 * 60 },
  contact: { limit: 10, windowSec: 60 * 60 },
  login: { limit: 20, windowSec: 15 * 60 },
} as const satisfies Record<string, RateRule>;

export type RateRuleName = keyof typeof RATE_RULES;

/* Signup emails to Cardinal: 20 an hour, then one "volume is high" notice. */
export const CARDINAL_SIGNUP_MAIL_CAP: RateRule = { limit: 20, windowSec: 60 * 60 };

export type MailCapVerdict = "send" | "send_flood_notice" | "drop";

/* `count` is this send's 1-based position in the current window. */
export function mailCapVerdict(count: number, rule: RateRule = CARDINAL_SIGNUP_MAIL_CAP): MailCapVerdict {
  if (count <= rule.limit) return "send";
  return count === rule.limit + 1 ? "send_flood_notice" : "drop";
}

export function isOverLimit(count: number, rule: RateRule): boolean {
  return count > rule.limit;
}

type HeaderBag = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined): string | undefined =>
  (Array.isArray(v) ? v[0] : v)?.split(",")[0]?.trim() || undefined;

const looksLikeIp = (v: string | undefined): v is string =>
  !!v && v.length <= 45 && /^[0-9a-fA-F:.]+$/.test(v);

/*
  Whose request is this? The backend sits directly on Railway's edge
  (not behind Cloudflare), which sets x-real-ip. Signup and login run as
  storefront SERVER actions, so their network address is the storefront
  server — shared by every buyer. The storefront therefore forwards the
  buyer's address in x-client-ip, and we believe it ONLY when the
  request proved it came from the storefront (`trusted`). An untrusted
  x-client-ip is ignored: otherwise a bot rotates the header and the
  limiter never bites.
*/
export function clientIpFrom(input: {
  headers: HeaderBag;
  socketIp?: string | null;
  trusted: boolean;
}): string {
  if (input.trusted) {
    const forwarded = first(input.headers["x-client-ip"]);
    if (looksLikeIp(forwarded)) return forwarded;
  }
  const real = first(input.headers["x-real-ip"]);
  if (looksLikeIp(real)) return real;
  const xff = first(input.headers["x-forwarded-for"]);
  if (looksLikeIp(xff)) return xff;
  return input.socketIp || "unknown";
}

/* Honeypot: a field humans never see, and a floor on time-to-submit. */
export const HONEYPOT_FIELD = "website";
export const MIN_FILL_MS = 1500;

export function honeypotTripped(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  const trap = b[HONEYPOT_FIELD];
  if (typeof trap === "string" && trap.trim() !== "") return true;
  const elapsed = b["elapsed_ms"];
  if (typeof elapsed === "number" && elapsed >= 0 && elapsed < MIN_FILL_MS) return true;
  return false;
}
