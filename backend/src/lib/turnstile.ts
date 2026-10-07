/*
  Cloudflare Turnstile server-side check. The secret lives only here.

  - No TURNSTILE_SECRET_KEY → the check is OFF. We shout about it in
    the log (once a minute) and let the request through: a missing key
    must never take the contact form down.
  - Cloudflare unreachable → fail open, logged. Same reason.
  - A missing or invalid token → "rejected".
*/

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type TurnstileVerdict = "ok" | "rejected" | "skipped";

let lastShout = 0;
function shout(log: { error: (m: string) => void }, message: string) {
  const now = Date.now();
  if (now - lastShout < 60_000) return;
  lastShout = now;
  log.error(`[abuse-guard] ${message}`);
}

export async function verifyTurnstile(
  token: string | undefined | null,
  ip: string | undefined,
  log: { error: (m: string) => void } = console,
  fetchImpl: typeof fetch = fetch
): Promise<TurnstileVerdict> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      shout(log, "TURNSTILE_SECRET_KEY is not set — bot challenge is OFF on signup and contact.");
    }
    return "skipped";
  }
  if (!token || typeof token !== "string" || token.length > 2048) return "rejected";

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetchImpl(VERIFY_URL, { method: "POST", body, signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) {
      shout(log, `Turnstile siteverify answered ${res.status}, FAILING OPEN.`);
      return "skipped";
    }
    const json = (await res.json()) as { success?: boolean };
    return json.success === true ? "ok" : "rejected";
  } catch (e: any) {
    shout(log, `Turnstile siteverify unreachable, FAILING OPEN: ${e?.message ?? e}`);
    return "skipped";
  }
}
