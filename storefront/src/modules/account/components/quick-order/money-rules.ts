/*
  Client-side mirror of the money rules (docs/specs/company-dashboard.md)
  — used ONLY to pick which submit button/path to show. The backend
  re-verifies everything server-side; nothing here is authoritative.

  Vocabulary (CONTEXT.md):
  - Buyable Line  — priced, weighed, quantity at/under stock on hand.
  - Quote-Only Line — cannot be paid for; rides a Quote Request.
*/

export const WEIGHT_LIMIT_LBS = 120
export const DEPOSIT_MIN_TOTAL = 7500

export type PortalCartLine = {
  variantId: string
  sku: string
  title: string
  thumbnail: string | null
  qty: number
  /* Company-priced unit price (calculated_price, as-is — never /100). */
  unitPrice: number | null
  currencyCode: string | null
  /* Pounds per unit; null/0 forces Quote-Only. */
  weight: number | null
  inventoryQuantity: number | null
  manageInventory: boolean
  /* product/variant metadata.requires_quote is "true"/true. */
  requiresQuote: boolean
}

export function isQuoteOnlyLine(line: PortalCartLine): boolean {
  if (line.requiresQuote) return true
  if (!line.unitPrice || line.unitPrice <= 0) return true
  if (!line.weight || line.weight <= 0) return true
  if (
    line.manageInventory &&
    line.inventoryQuantity != null &&
    line.qty > line.inventoryQuantity
  ) {
    return true
  }
  return false
}

export type SubmitPath =
  | "invoice" /* Place Order → place-invoice-order */
  | "checkout" /* Review & Pay → standard checkout */
  | "deposit" /* Place Order (50% deposit) → place-deposit-order */
  | "quote_all" /* whole order must be quoted (heavy + under $7,500) */
  | "quote_only" /* nothing payable — everything rides the quote */

export type CartPlan = {
  path: SubmitPath
  payable: PortalCartLine[]
  quoteOnly: PortalCartLine[]
  /* Lines the pay path will submit ([] when everything is quoted). */
  payLines: PortalCartLine[]
  /* Lines the Quote Request will carry (payable ones too on quote_all). */
  quoteLines: PortalCartLine[]
  payableTotal: number
  payableWeight: number
}

export function planCart(
  lines: PortalCartLine[],
  invoicePaymentEnabled: boolean
): CartPlan {
  const payable = lines.filter((l) => !isQuoteOnlyLine(l))
  const quoteOnly = lines.filter((l) => isQuoteOnlyLine(l))

  const payableTotal = payable.reduce(
    (sum, l) => sum + (l.unitPrice ?? 0) * l.qty,
    0
  )
  const payableWeight = payable.reduce(
    (sum, l) => sum + (l.weight ?? 0) * l.qty,
    0
  )

  const base = { payable, quoteOnly, payableTotal, payableWeight }

  if (!payable.length) {
    return { ...base, path: "quote_only", payLines: [], quoteLines: quoteOnly }
  }

  if (invoicePaymentEnabled) {
    return { ...base, path: "invoice", payLines: payable, quoteLines: quoteOnly }
  }

  if (payableWeight <= WEIGHT_LIMIT_LBS) {
    return { ...base, path: "checkout", payLines: payable, quoteLines: quoteOnly }
  }

  if (payableTotal < DEPOSIT_MIN_TOTAL) {
    /* Heavy but under the deposit threshold: the whole order is quoted. */
    return {
      ...base,
      path: "quote_all",
      payLines: [],
      quoteLines: [...payable, ...quoteOnly],
    }
  }

  return { ...base, path: "deposit", payLines: payable, quoteLines: quoteOnly }
}
