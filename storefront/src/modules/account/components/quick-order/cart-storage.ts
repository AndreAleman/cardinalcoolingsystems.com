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
      return
    }
    const payload: StoredCart = { savedAt: Date.now(), lines }
    window.localStorage.setItem(storageKey(companyId), JSON.stringify(payload))
  } catch {
    // Storage full / blocked (private mode) — persistence is best-effort.
  }
}
