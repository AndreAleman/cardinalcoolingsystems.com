"use client"

// Part Number card: the live Part Number and description, the Pricing Mode badge with its one-line
// reason (always BEFORE the price), the price block (per unit, total, basis, as-of date, sign-in
// prompt), the lead time, the weight and any engineering-review flags. Never a blank price
// (lib/builder/pricing-view.ts).

import { formatLb, totalLb } from "@lib/cpq/shared"
import { SIGN_IN_PROMPT, type PricingView } from "@lib/builder/pricing-view"
import { convertToLocale } from "@lib/util/money"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"

export type PartNumberCardProps = {
  partNumber: string
  description: string
  view: PricingView
  unitNoun: string
  unitsNoun: string
  units: number
  weightLb: number
  reviewReasons: string[]
  onRetry: () => void
}

const money = (amount: number, currency: string) => convertToLocale({ amount, currency_code: currency })

export function PricingBadge({ view }: { view: PricingView }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid="pricing-mode">
      <span
        data-testid="pricing-badge"
        data-mode={view.mode}
        className={clx(
          "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide",
          view.mode === "instant" && "bg-emerald-600 text-white",
          view.mode === "quote" && "bg-neutral-900 text-white",
          view.mode === "checking" && "border border-neutral-300 bg-white text-neutral-600",
        )}
      >
        {view.mode === "checking" ? (
          <span aria-hidden className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-r-transparent" />
        ) : null}
        {view.badge}
      </span>
      <span className="text-sm text-neutral-600" data-testid="pricing-reason">
        {view.reason}
      </span>
    </div>
  )
}

export default function PartNumberCard({
  partNumber,
  description,
  view,
  unitNoun,
  unitsNoun,
  units,
  weightLb,
  reviewReasons,
  onRetry,
}: PartNumberCardProps) {
  const p = view.price
  return (
    <section
      aria-label="Part Number and price"
      className="border border-neutral-200 bg-white p-4 xsmall:p-6"
      data-testid="part-number-card"
      data-mode={view.mode}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Part Number</p>
      <p className="break-all font-mono text-xl font-semibold text-neutral-900 small:text-2xl" data-testid="part-number">
        {partNumber}
      </p>
      <p className="mt-1 text-sm text-neutral-600" data-testid="part-description">
        {description}
      </p>

      <div className="mt-4">
        <PricingBadge view={view} />
      </div>

      <div className="mt-4 border-t border-neutral-100 pt-4" aria-live="polite" data-testid="price-block">
        {p.kind === "price" ? (
          <div className="flex flex-col gap-1">
            <p className="text-3xl font-semibold text-neutral-900" data-testid="price-per-unit">
              {money(p.perUnit, p.currency)}
              <span className="ml-1 text-base font-normal text-neutral-600">per {unitNoun}</span>
            </p>
            {units > 1 ? (
              <p className="text-base text-neutral-800" data-testid="price-total">
                {money(p.total, p.currency)} total for {units} {unitsNoun}
              </p>
            ) : null}
            <p className="text-xs text-neutral-500" data-testid="price-basis">
              {p.basis === "company" ? "Your company price" : "List price"}
              {p.asOf ? `, as of ${p.asOf}` : ""}
            </p>
            {view.signInPrompt ? (
              <LocalizedClientLink href="/account" className="text-sm font-medium text-cardinal-red underline" data-testid="sign-in-prompt">
                {SIGN_IN_PROMPT}
              </LocalizedClientLink>
            ) : null}
          </div>
        ) : p.kind === "quote" ? (
          <div className="flex flex-col gap-1">
            <p className="text-lg font-semibold text-neutral-900" data-testid="quote-promise">
              {p.promise}
            </p>
            <p className="text-xs text-neutral-500">Priced by our shop; drawing and Part Number travel with the quote.</p>
          </div>
        ) : (
          <p className="text-base text-neutral-700" data-testid="price-checking">
            Checking posted prices and stock…
          </p>
        )}
        {view.error ? (
          <p className="mt-2 text-sm text-neutral-600" data-testid="resolve-error">
            Live prices didn&apos;t load.{" "}
            <button type="button" className="font-medium text-cardinal-red underline" onClick={onRetry}>
              Try again
            </button>
          </p>
        ) : null}
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-4 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Lead time</dt>
          <dd className="font-medium text-neutral-900" data-testid="lead-time">
            {view.leadTime}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-neutral-500">Weight</dt>
          <dd className="font-medium text-neutral-900" data-testid="weight">
            {weightText(weightLb)} per {unitNoun}
            {units > 1 && weightLb > 0 ? (
              <span className="block text-xs font-normal text-neutral-500" data-testid="weight-total">
                {formatLb(totalLb(weightLb, units))} lb for {units} {unitsNoun}
              </span>
            ) : null}
          </dd>
        </div>
      </dl>

      {reviewReasons.length ? (
        <p className="mt-3 text-sm font-medium text-cardinal-red" data-testid="engineering-review">
          Engineering review: {reviewReasons.join("; ")}
        </p>
      ) : null}
    </section>
  )
}

/**
 * Per-unit weight, "≈ 88.6 lb": rounded once to 0.1 lb (shared formatLb, as on the drawing's title
 * block); the total is that rounded weight × units (shared totalLb), so a pair is exactly 2 × one.
 */
export function weightText(lb: number): string {
  if (!Number.isFinite(lb) || lb <= 0) return "—"
  return `≈ ${formatLb(lb)} lb`
}
