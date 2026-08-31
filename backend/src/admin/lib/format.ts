/* Shared admin formatting helpers. Amounts are Medusa-convention
   dollars as-is (49.99 = $49.99, never cents). */

export function formatAmount(amount: number | null | undefined, currencyCode?: string | null) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return "—"
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: (currencyCode || "usd").toUpperCase(),
  }).format(n)
}

export function formatDate(iso: string | Date | null | undefined) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}
