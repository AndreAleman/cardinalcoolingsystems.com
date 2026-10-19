// Builder lines in the cart (plan B3): a Quote-mode configuration is one custom line item at
// unit_price 0 whose server-built metadata says `builder: true`. These lines are not broken $0
// parts: they show their Part Number, configuration and a "Quote" badge, and they send the cart
// to Guest Quote / Request Quote instead of checkout. Pure; unit-tested in __tests__/quote-line.test.ts.

type LineLike = {
  metadata?: Record<string, unknown> | null
  product_title?: string | null
  title?: string | null
  unit_price?: number | null
} | null | undefined

export type BuilderLineView = {
  partNumber: string
  builderType: string | null
  /** Label/value rows of the configuration. */
  display: { label: string; value: string }[]
  quote: boolean
  leadTime: string | null
  title: string
}

/** True when a cart line came from a builder (metadata.builder === true; "true" from older JSON). */
export function isBuilderLine(item: LineLike): boolean {
  const b = item?.metadata?.builder
  return b === true || b === "true"
}

/** True for a builder Quote line (pricing_mode "quote"), which can never be checked out. */
export function isBuilderQuoteLine(item: LineLike): boolean {
  return isBuilderLine(item) && item?.metadata?.pricing_mode === "quote"
}

export function cartHasBuilderLine(items: readonly LineLike[] | null | undefined): boolean {
  return (items ?? []).some(isBuilderLine)
}

export function cartHasBuilderQuoteLine(items: readonly LineLike[] | null | undefined): boolean {
  return (items ?? []).some(isBuilderQuoteLine)
}

/** The `source` of the guest quote's contact_form_submitted event (plan B4). */
export function guestQuoteSource(items: readonly LineLike[] | null | undefined): "builder" | "cart" {
  return cartHasBuilderLine(items) ? "builder" : "cart"
}

function displayRows(v: unknown): { label: string; value: string }[] {
  if (Array.isArray(v)) {
    return v
      .filter((r) => r && typeof r === "object" && typeof (r as any).label === "string")
      .map((r) => ({ label: String((r as any).label), value: String((r as any).value ?? "") }))
  }
  if (v && typeof v === "object") {
    return Object.entries(v as Record<string, unknown>).map(([label, value]) => ({ label, value: String(value ?? "") }))
  }
  if (typeof v === "string" && v.trim()) return [{ label: "Configuration", value: v.trim() }]
  return []
}

/** What the cart and the quote modal show for a builder line; null for any other line. */
export function builderLineView(item: LineLike): BuilderLineView | null {
  if (!isBuilderLine(item)) return null
  const m = item!.metadata ?? {}
  const str = (x: unknown) => (typeof x === "string" && x.trim() ? x.trim() : null)
  const lead = m.lead_time as unknown
  const leadTime = str(lead) ?? (lead && typeof lead === "object" ? str((lead as any).label) : null)
  return {
    partNumber: str(m.part_number) ?? "",
    builderType: str(m.builder_type),
    display: displayRows(m.configuration_display),
    quote: m.pricing_mode === "quote",
    leadTime,
    title: str(item!.product_title) ?? str(item!.title) ?? "Builder configuration",
  }
}
