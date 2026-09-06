/*
  localStorage persistence for the Quick Order's in-progress lines
  (ported from accurateforklift.net's cart-storage).

  The key includes the Company id so two Companies sharing a browser
  (or a person switching Companies) never see each other's draft.
  Entries expire after 7 days so a stale draft (with stale pricing)
  doesn't resurface as a surprise. All functions are SSR-safe no-ops
  when `window` is unavailable.
*/

import type { PortalCartLine } from "./money-rules"

const KEY_PREFIX = "cardinal-quick-order-v1"
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

type StoredCart = {
  savedAt: number
  lines: PortalCartLine[]
}

function storageKey(companyId: string): string {
  return `${KEY_PREFIX}:${companyId}`
}

export function loadStoredCartLines(companyId: string): PortalCartLine[] {
  if (typeof window === "undefined" || !companyId) return []
  try {
    const raw = window.localStorage.getItem(storageKey(companyId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredCart
    if (!Array.isArray(parsed?.lines)) return []
    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) {
      window.localStorage.removeItem(storageKey(companyId))
      return []
    }
    return parsed.lines.filter(
      (l) => l && typeof l.variantId === "string" && Number(l.qty) > 0
    )
  } catch {
    return []
  }
}

export function saveStoredCartLines(
  companyId: string,
  lines: PortalCartLine[]
): void {
  if (typeof window === "undefined" || !companyId) return
  try {
    if (!lines.length) {
      window.localStorage.removeItem(storageKey(companyId))
    } else {
      const payload: StoredCart = { savedAt: Date.now(), lines }
      window.localStorage.setItem(
        storageKey(companyId),
        JSON.stringify(payload)
      )
    }
  } catch {
    // Storage full / blocked (private mode) — persistence is best-effort.
  }
  notifyPortalCartUpdated()
}

/*
  ---- Cart-bridge helpers (nav badge + combine popup) ----

  The nav renders on public pages where the PortalCartProvider isn't
  mounted and the Company id isn't known client-side, so the badge and
  the bridge read the stored draft directly: scan for our key prefix
  and take the freshest non-expired entry (a browser normally holds at
  most one Company's draft).
*/

export const PORTAL_CART_UPDATED_EVENT = "portal-cart-updated"

export function notifyPortalCartUpdated(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PORTAL_CART_UPDATED_EVENT))
  }
}

export type StoredPortalCart = {
  companyId: string
  lines: PortalCartLine[]
}

export function loadAnyStoredCart(): StoredPortalCart | null {
  if (typeof window === "undefined") return null
  try {
    let best: (StoredPortalCart & { savedAt: number }) | null = null
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i)
      if (!key || !key.startsWith(`${KEY_PREFIX}:`)) continue
      const companyId = key.slice(KEY_PREFIX.length + 1)
      const lines = loadStoredCartLines(companyId)
      if (!lines.length) continue
      const raw = window.localStorage.getItem(key)
      const savedAt = raw ? (JSON.parse(raw) as StoredCart).savedAt ?? 0 : 0
      if (!best || savedAt > best.savedAt) {
        best = { companyId, lines, savedAt }
      }
    }
    return best ? { companyId: best.companyId, lines: best.lines } : null
  } catch {
    return null
  }
}

/* Total units in a stored draft — the badge's portal-side count. */
export function countStoredCartUnits(): number {
  const stored = loadAnyStoredCart()
  return stored
    ? stored.lines.reduce((sum, l) => sum + (Number(l.qty) || 0), 0)
    : 0
}
