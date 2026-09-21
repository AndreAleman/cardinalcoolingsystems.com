import Redis from "ioredis";
import type { RateRule } from "../utils/abuse-policy";

/*
  Fixed-window counter. Redis when REDIS_URL is set (shared across
  restarts and replicas); otherwise an in-process map, which is still a
  real limit on a single instance. NEVER throws: if Redis is down the
  caller gets `null` and must let the request through (fail open — the
  contact form is the revenue path; Turnstile still guards it).
*/

let client: Redis | null | undefined;
let warned = false;

function redis(): Redis | null {
  if (client !== undefined) return client;
  const url = process.env.REDIS_URL;
  if (!url) {
    client = null;
    return client;
  }
  client = new Redis(url, {
    // Queue commands issued before the connection is ready (otherwise
    // the first hits after boot all fail open), but never hang a
    // request on a dead Redis: give up after one retry / 1.5s.
    maxRetriesPerRequest: 1,
    commandTimeout: 1500,
    connectTimeout: 2000,
  });
  // Without a listener ioredis prints every reconnect error itself.
  client.on("error", () => {});
  return client;
}

const memory = new Map<string, { count: number; resetAt: number }>();

function hitMemory(key: string, rule: RateRule, now: number): number {
  if (memory.size > 50_000) {
    for (const [k, v] of memory) if (v.resetAt <= now) memory.delete(k);
  }
  const cur = memory.get(key);
  if (!cur || cur.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + rule.windowSec * 1000 });
    return 1;
  }
  cur.count += 1;
  return cur.count;
}

/*
  Count this hit and return its 1-based position in the window, or
  null when the count could not be taken (caller fails open).
*/
export async function hit(
  key: string,
  rule: RateRule,
  log?: { error: (m: string) => void }
): Promise<number | null> {
  // Test suites share one address and would trip the limits by accident.
  if (process.env.RATE_LIMIT_DISABLED === "1") return null;
  const r = redis();
  if (!r) return hitMemory(key, rule, Date.now());
  try {
    const full = `rl:${key}`;
    // INCR + TTL, then EXPIRE when the key is new or has no expiry.
    // (Not EXPIRE … NX: that needs Redis 7, and on an older server the
    // key would never expire and lock a buyer out for good.)
    const res = await r.multi().incr(full).ttl(full).exec();
    const count = res?.[0]?.[1];
    const ttl = res?.[1]?.[1];
    if (typeof count !== "number") return null;
    if (count === 1 || ttl === -1) await r.expire(full, rule.windowSec);
    return count;
  } catch (e: any) {
    if (!warned) {
      warned = true;
      setTimeout(() => (warned = false), 60_000).unref?.();
      (log ?? console).error(
        `[abuse-guard] rate limiter unavailable, FAILING OPEN: ${e?.message ?? e}`
      );
    }
    return null;
  }
}

/* Tests only. */
export function __resetRateLimitMemory() {
  memory.clear();
}
