// What the Pricing Mode badge and the price block show, from the resolve state (pure; unit-tested
// in __tests__/pricing-view.test.ts). B1: the price is never invented. Instant shows the resolver's
// posted price; Quote shows the quote promise and the lead time; a loading or failed resolve never
// leaves the price blank: it shows the quote promise (when the builder is Quote by construction) or
// "checking" with the stock lead time.

import { QUOTE_PROMISE, type LeadTime } from "@lib/cpq/shared"
import type { PriceBasis, ResolveResponse } from "./types"

export type ResolveStatus = "idle" | "loading" | "done" | "error"

export type PriceLine =
  | {
      kind: "price"
      perUnit: number
      total: number
      currency: string
      basis: PriceBasis
      /** "Oct 18, 2026" */
      asOf: string
    }
  | { kind: "quote"; promise: string }
  | { kind: "checking" }

export type PricingView = {
  mode: "instant" | "quote" | "checking"
  badge: string
  /** One line explaining the mode, shown with the badge before any price. */
  reason: string
  price: PriceLine
  /** "Sign in with your work email for your pricing" (list-price viewers of a posted price). */
  signInPrompt: boolean
  leadTime: string
  /** The resolve failed: offer a retry. */
  error: boolean
}

export const SIGN_IN_PROMPT = "Sign in with your work email for your pricing"

export const INSTANT_REASON = "Every part is stocked with a posted price."
export const QUOTE_REASON_DEFAULT = "Welded or cut to length, or a part we don't stock yet."
export const CHECKING_REASON = "Checking posted prices and stock…"
export const ERROR_REASON = "Live prices are unavailable right now, so we'll quote it."

/** "Oct 18, 2026" from an ISO date or timestamp; "" when unparseable. Date-only ISO stays that day. */
export function formatAsOf(iso: string | null | undefined): string {
  if (!iso) return ""
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(iso)
  const d = new Date(dateOnly ? `${iso}T12:00:00Z` : iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", {
    timeZone: dateOnly ? "UTC" : "America/New_York",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function positive(n: number | null | undefined): number | null {
  return typeof n === "number" && Number.isFinite(n) && n > 0 ? n : null
}

/** One-line reason for a Quote result: the first resolver reason, or the default. */
export function quoteReasonLine(reasons: readonly string[] | null | undefined): string {
  const r = (reasons ?? []).map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean)
  if (!r.length) return QUOTE_REASON_DEFAULT
  return r.length === 1 ? r[0] : `${r[0]} (+${r.length - 1} more)`
}

export function pricingView(input: {
  status: ResolveStatus
  result: ResolveResponse | null
  /** builder.leadTime(options): "custom" means Quote whatever the stock says. */
  staticLeadTime: LeadTime
}): PricingView {
  const { status, result, staticLeadTime } = input

  if (status === "done" && result) {
    const perUnit = positive(result.price_per_unit)
    const total = positive(result.price_total)
    if (result.pricing_mode === "instant" && perUnit !== null) {
      return {
        mode: "instant",
        badge: "Instant",
        reason: INSTANT_REASON,
        price: {
          kind: "price",
          perUnit,
          total: total ?? perUnit * Math.max(1, result.units || 1),
          currency: result.currency_code || "usd",
          basis: result.price_basis,
          asOf: formatAsOf(result.priced_at),
        },
        signInPrompt: result.price_basis !== "company",
        leadTime: result.lead_time?.label || staticLeadTime.label,
        error: false,
      }
    }
    // Quote, or an "instant" result without a usable price (never show $0).
    return {
      mode: "quote",
      badge: "Quote",
      reason: quoteReasonLine(result.quote_reasons),
      price: { kind: "quote", promise: QUOTE_PROMISE },
      signInPrompt: false,
      leadTime: result.lead_time?.label || staticLeadTime.label,
      error: false,
    }
  }

  // Loading, idle or failed: Quote by construction when anything is fabricated or never stocked.
  if (staticLeadTime.kind === "custom") {
    return {
      mode: "quote",
      badge: "Quote",
      reason: QUOTE_REASON_DEFAULT,
      price: { kind: "quote", promise: QUOTE_PROMISE },
      signInPrompt: false,
      leadTime: staticLeadTime.label,
      error: status === "error",
    }
  }
  if (status === "error") {
    return {
      mode: "quote",
      badge: "Quote",
      reason: ERROR_REASON,
      price: { kind: "quote", promise: QUOTE_PROMISE },
      signInPrompt: false,
      leadTime: staticLeadTime.label,
      error: true,
    }
  }
  return {
    mode: "checking",
    badge: "Checking stock",
    reason: CHECKING_REASON,
    price: { kind: "checking" },
    signInPrompt: false,
    leadTime: staticLeadTime.label,
    error: false,
  }
}

/** The pricing_mode tag for analytics and the drawing ("instant" | "quote"); checking → quote. */
export function pricingModeTag(view: PricingView): "instant" | "quote" {
  return view.mode === "instant" ? "instant" : "quote"
}
