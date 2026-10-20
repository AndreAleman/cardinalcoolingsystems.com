import { describe, expect, it } from "vitest"
import { QUOTE_PROMISE, leadTimeOf } from "@lib/cpq/shared"
import { formatAsOf, pricingView, quoteReasonLine, SIGN_IN_PROMPT, QUOTE_REASON_DEFAULT } from "../pricing-view"
import type { ResolveResponse } from "../types"

const STOCK = leadTimeOf("stock")
const CUSTOM = leadTimeOf("custom")

function resolved(over: Partial<ResolveResponse>): ResolveResponse {
  return {
    builder_type: "cdu-kit",
    options: {},
    ignored: [],
    config_key: "k",
    part_number: "kit-cdu-deadbeef",
    description: "",
    pricing_mode: "instant",
    quote_reasons: [],
    bom: [],
    units: 4,
    price_per_unit: 250,
    price_total: 1000,
    currency_code: "usd",
    price_basis: "list",
    priced_at: "2026-10-18",
    weight_lb_per_unit: 10,
    weight_lb_total: 40,
    lead_time: STOCK,
    standard_range: { ok: true, reasons: [] },
    spec_block: "",
    configuration_id: null,
    ...over,
  }
}

describe("pricingView", () => {
  it("Instant at list price: price, basis, as-of date and the sign-in prompt", () => {
    const v = pricingView({ status: "done", result: resolved({}), staticLeadTime: STOCK })
    expect(v.mode).toBe("instant")
    expect(v.badge).toBe("Instant")
    expect(v.price).toEqual({ kind: "price", perUnit: 250, total: 1000, currency: "usd", basis: "list", asOf: "Oct 18, 2026" })
    expect(v.signInPrompt).toBe(true)
    expect(v.leadTime).toBe(STOCK.label)
  })

  it("Instant at the company price: no sign-in prompt", () => {
    const v = pricingView({ status: "done", result: resolved({ price_basis: "company" }), staticLeadTime: STOCK })
    expect(v.price.kind === "price" && v.price.basis).toBe("company")
    expect(v.signInPrompt).toBe(false)
  })

  it("Quote: the promise and the lead time, the first reason, never a price", () => {
    const v = pricingView({
      status: "done",
      result: resolved({ pricing_mode: "quote", price_per_unit: null, price_total: null, quote_reasons: ["Welded spool", "No stocked 316L strainer"], lead_time: CUSTOM }),
      staticLeadTime: CUSTOM,
    })
    expect(v.mode).toBe("quote")
    expect(v.price).toEqual({ kind: "quote", promise: QUOTE_PROMISE })
    expect(v.reason).toBe("Welded spool (+1 more)")
    expect(v.leadTime).toBe(CUSTOM.label)
    expect(v.signInPrompt).toBe(false)
  })

  it("Quote uses the resolver's quote_promise when given", () => {
    const v = pricingView({
      status: "done",
      result: resolved({ pricing_mode: "quote", price_per_unit: null, price_total: null, quote_promise: "Firm quote soon" }),
      staticLeadTime: CUSTOM,
    })
    expect(v.price).toEqual({ kind: "quote", promise: "Firm quote soon" })
  })

  it("an 'instant' result with no usable price is shown as Quote, never $0", () => {
    const v = pricingView({ status: "done", result: resolved({ price_per_unit: 0 }), staticLeadTime: STOCK })
    expect(v.mode).toBe("quote")
    expect(v.price.kind).toBe("quote")
  })

  it("loading a builder that is Quote by construction shows the promise at once", () => {
    const v = pricingView({ status: "loading", result: null, staticLeadTime: CUSTOM })
    expect(v.mode).toBe("quote")
    expect(v.price).toEqual({ kind: "quote", promise: QUOTE_PROMISE })
    expect(v.leadTime).toBe(CUSTOM.label)
  })

  it("loading a possibly-Instant builder shows 'checking' with the stock lead time, not a blank", () => {
    const v = pricingView({ status: "loading", result: null, staticLeadTime: STOCK })
    expect(v.mode).toBe("checking")
    expect(v.price.kind).toBe("checking")
    expect(v.leadTime).toBe(STOCK.label)
    expect(v.reason.length).toBeGreaterThan(0)
  })

  it("a failed resolve falls back to the quote promise with a retry", () => {
    const v = pricingView({ status: "error", result: null, staticLeadTime: STOCK })
    expect(v.mode).toBe("quote")
    expect(v.price.kind).toBe("quote")
    expect(v.error).toBe(true)
  })
})

describe("helpers", () => {
  it("formatAsOf keeps a date-only ISO on its day", () => {
    expect(formatAsOf("2026-10-18")).toBe("Oct 18, 2026")
    expect(formatAsOf("nope")).toBe("")
    expect(formatAsOf(null)).toBe("")
  })
  it("quoteReasonLine defaults", () => {
    expect(quoteReasonLine([])).toBe(QUOTE_REASON_DEFAULT)
    expect(quoteReasonLine(["One"])).toBe("One")
  })
  it("sign-in prompt wording", () => {
    expect(SIGN_IN_PROMPT).toBe("Sign in with your work email for your pricing")
  })
})
