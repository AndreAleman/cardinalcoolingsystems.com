// Cardinal Builder: the storefront's view of the backend contracts
// (docs/specs/cardinal-builder-plan.md, "Backend contracts"). Mirrors the commerce stream's
// POST /store/build/resolve and POST /store/build/quote-lines, and the CAD stream's
// POST /store/cad-requests and GET /store/cad-downloads/:token. Types only.

import type { BuilderType, Options } from "@lib/cpq/shared"

export type PricingMode = "instant" | "quote"
export type PriceBasis = "company" | "list"

/** One BOM row of a resolve (plan: resolve response `bom[]`). */
export type ResolvedBomLine = {
  role: string
  label: string
  sku: string | null
  variant_id: string | null
  qty_per_unit: number
  qty_total: number
  unit_price: number | null
  line_total: number | null
  in_stock: boolean | null
  stock_qty: number | null
  weight_lb: number | null
  lead_time: "stock" | "custom"
  resolved: boolean
  /** "fabricated" = welded or cut to length (never Instant). */
  kind?: "sku" | "fabricated"
  /** Why the line isn't Instant (null/absent when it is). */
  reason?: string | null
  part_number?: string | null
  note?: string | null
}

/** POST /store/build/resolve response. */
export type ResolveResponse = {
  builder_type: BuilderType
  options: Options
  ignored: string[]
  config_key: string
  part_number: string
  description: string
  pricing_mode: PricingMode
  quote_reasons: string[]
  bom: ResolvedBomLine[]
  units: number
  price_per_unit: number | null
  price_total: number | null
  currency_code: string
  price_basis: PriceBasis
  /** ISO date of the resolve: the price's as-of date. */
  priced_at: string
  weight_lb_per_unit: number
  lead_time: { kind: "stock" | "custom"; label: string }
  standard_range: { ok: boolean; reasons: { code: string; message: string }[] }
  spec_block: string
  configuration_id: string | null
  /** "/build/<type>?v=1&…" (no country prefix). */
  share_path?: string
  /** The quote promise in Quote mode; null when Instant. */
  quote_promise?: string | null
  /**
   * Transition only: the stocked adapter that does the same job. When it resolves, the whole
   * response is Instant with that single adapter line.
   */
  stocked_alternative?: StockedAlternative | null
}

export type StockedAlternative = {
  sku: string
  variant_id: string | null
  unit_price: number | null
}

export type QuoteLineAdded = {
  kind: "variant" | "quote_only" | "quote"
  sku?: string
  variant_id?: string
  quantity: number
  part_number?: string
  title?: string
  configuration_id?: string
}

/** POST /store/build/quote-lines response. */
export type QuoteLinesResponse = {
  cart_id: string
  pricing_mode: PricingMode
  part_number: string
  configuration_id: string | null
  ignored: string[]
  added: QuoteLineAdded[]
}

/** Server-action result wrapper: actions never throw across the boundary (Next strips messages). */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; message: string; status?: number }

// ------------------------------------------------------------------------------------- CAD

export type CadFileKind = "step" | "pdf"
export type CadFile = { kind: CadFileKind; filename: string; bytes: number }

export type CadDownloadStatus = "ready" | "preparing" | "queued" | "expired" | "failed" | "review"

/** GET /store/cad-downloads/:token → { cad_download }. */
export type CadDownloadDTO = {
  status: CadDownloadStatus
  builder_type?: BuilderType
  part_number: string
  description: string
  display_id: number | null
  configuration_display: { label: string; value: string }[]
  /** "/build/<type>?v=1&…" (no country prefix). */
  share_path: string
  expires_at: string | null
  downloads_remaining: number | null
  files: CadFile[]
}

export type CadRequestErrorCode =
  | "email_allowance"
  | "ip_daily"
  | "outside_standard_range"
  | "invalid"
  | "unavailable"
  | "turnstile"

export type CadRequestResult =
  | { ok: true; outcome: "review" | "queued" | "emailed"; partNumber: string; displayId: number | null; email: string | null }
  | { ok: true; outcome: "blocked" }
  | { ok: true; outcome: "ready"; partNumber: string; token: string; files: CadFile[] }
  | { ok: false; code: CadRequestErrorCode; message: string }

export type CadRequestInput = {
  builder_type: BuilderType
  options: Options
  name: string
  company: string
  email: string
  source_page?: string
  /** Bot guard (modules/common/components/bot-guard): honeypot, time on form, Turnstile. */
  website?: string
  elapsed_ms?: number
  turnstile_token?: string
}
