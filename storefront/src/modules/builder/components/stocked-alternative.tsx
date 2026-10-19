// Transition only (spec Page 3): the resolver found a stocked adapter that does the same job. The
// resolve is then Instant with that single adapter line, so the main "Add to Quote List" adds the
// adapter at its posted price; this callout says so. The custom spool's drawing and Part Number
// stay on the page for context.

import { leadTimeOf } from "@lib/cpq/shared"
import type { StockedAlternative } from "@lib/builder/types"
import { convertToLocale } from "@lib/util/money"

export default function StockedAlternativeCallout({ alt, currency }: { alt: StockedAlternative; currency: string }) {
  const price = typeof alt.unit_price === "number" && alt.unit_price > 0 ? alt.unit_price : null
  const ships = leadTimeOf("stock").label.replace(/^Ships in /i, "ships in ")
  return (
    <section className="border-2 border-emerald-600 bg-emerald-50 p-4" aria-label="Stocked alternative" data-testid="stocked-alternative">
      <p className="text-base font-semibold text-neutral-900">
        We stock this as <span className="font-mono">{alt.sku}</span>: {ships}.
      </p>
      <p className="mt-1 text-sm text-neutral-700">
        {price !== null ? (
          <>
            <span className="font-semibold">{convertToLocale({ amount: price, currency_code: currency })}</span> each, Instant.{" "}
          </>
        ) : null}
        Add to Quote List adds the stocked adapter instead of a custom spool. It has its own fixed length; the drawing below
        shows the custom spool you configured, for reference.
      </p>
    </section>
  )
}
