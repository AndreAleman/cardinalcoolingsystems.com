// Small server-rendered pieces shared by the builder pages.

import { ASSEMBLIES, QUOTE_PROMISE } from "@lib/cpq/shared"
import Link from "next/link"

/** B14 on the kit pages. */
export const KIT_WE_CAN_SUPPLY = [
  { label: "Quick disconnects", category: "Quick disconnects (CDU kit)" },
  { label: "Leak-detection trays", category: "Leak-detection trays (CDU kit)" },
  { label: "Mounting hardware", category: "Mounting hardware (CDU kit)" },
]

/** B14 on the manifold page. Cardinal's own coupling stays off the site (FD83 review). */
export const MANIFOLD_WE_CAN_SUPPLY = [
  { label: "Quick disconnects", category: "Quick disconnects (row manifold)" },
  { label: "Leak-detection trays", category: "Leak-detection trays (row manifold)" },
  { label: "Mounting hardware", category: "Mounting hardware (row manifold)" },
]

/** B14: parts we supply but don't configure. Each gets a "we can supply" line and a quote link. */
export function WeCanSupply({ countryCode, items }: { countryCode: string; items: { label: string; category: string }[] }) {
  return (
    <div className="border-t border-neutral-200 pt-4" data-testid="we-can-supply">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600">We can supply</p>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm text-neutral-700">
        {items.map((i) => (
          <li key={i.label} className="flex flex-wrap items-baseline justify-between gap-2">
            <span>{i.label}</span>
            <Link
              href={`/${countryCode}/contact?category=${encodeURIComponent(i.category)}`}
              className="text-xs font-semibold text-cardinal-red underline"
            >
              Get a quote
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function GlycolNote() {
  return (
    <p className="border-l-2 border-cardinal-red bg-neutral-50 px-3 py-2 text-xs text-neutral-700" data-testid="glycol-note">
      Glycol loops: EPDM peroxide-cured gaskets are the default for water and PG25 propylene glycol. Silicone and PTFE are
      options; tell us your coolant and we&apos;ll confirm compatibility on the quote.
    </p>
  )
}

/** The two lead times and the quote promise, from the shared tables. */
export function LeadTimeFacts() {
  return (
    <ul className="grid grid-cols-1 gap-3 xsmall:grid-cols-3" data-testid="lead-time-facts">
      <li className="border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Instant</p>
        <p className="mt-1 text-sm text-neutral-800">Stocked parts. {ASSEMBLIES.lead_time.stock}.</p>
      </li>
      <li className="border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Quote</p>
        <p className="mt-1 text-sm text-neutral-800">Welded or cut to length. {ASSEMBLIES.lead_time.custom}.</p>
      </li>
      <li className="border border-neutral-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Our promise</p>
        <p className="mt-1 text-sm text-neutral-800">{QUOTE_PROMISE}.</p>
      </li>
    </ul>
  )
}
