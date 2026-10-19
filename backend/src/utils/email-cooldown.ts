/*
  In-memory send-suppression for outbound CAD email (ported from Sanitube): the durable backstop
  behind the HTTP rate limiter, so requests slow enough to pass the per-IP limits still can't turn
  Resend into a mailbomb. Single backend container, so process-local state is authoritative;
  counters reset on deploy, which only ever errs toward sending.
*/

const lastSent = new Map<string, number>()

// Prune so a spray of unique addresses can't grow the map unbounded.
const MAX_ENTRIES = 10_000

/**
 * True if `key` hasn't been used within `cooldownMs` (and records the use); false while inside the
 * window (the caller skips the send).
 */
export function shouldSend(key: string, cooldownMs: number): boolean {
  const now = Date.now()
  const last = lastSent.get(key)
  if (last !== undefined && now - last < cooldownMs) return false

  if (lastSent.size >= MAX_ENTRIES) {
    for (const [k, t] of lastSent) {
      if (now - t > cooldownMs) lastSent.delete(k)
      if (lastSent.size < MAX_ENTRIES / 2) break
    }
    // Pathological case: everything is fresh. Refuse instead of growing.
    if (lastSent.size >= MAX_ENTRIES) return false
  }

  lastSent.set(key, now)
  return true
}

/** Tests only. */
export function __resetEmailCooldowns() {
  lastSent.clear()
}
