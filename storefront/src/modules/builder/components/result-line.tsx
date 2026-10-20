"use client"

// The result line under the headline: one live sentence, count first, then what's in it, then the
// resolve's price (or the quote promise and lead time). Skeleton while the resolve runs; never a
// price that didn't come from the resolve (lib/result-summary.ts). Engineering-review flags (e.g.
// "header exceeds one 20 ft stick") sit right under it.

import type { ResultSummary } from "@modules/builder/lib/result-summary"

export default function ResultLine({ summary, reviewReasons }: { summary: ResultSummary; reviewReasons: string[] }) {
  const p = summary.price
  return (
    <div className="flex flex-col gap-2" data-testid="result-line-wrap">
      <p
        className="text-lg leading-snug text-neutral-800 small:text-2xl"
        aria-live="polite"
        aria-atomic="true"
        data-testid="result-line"
        data-state={p.kind}
      >
        <strong className="font-semibold text-neutral-900" data-testid="result-units">
          {summary.units}
        </strong>
        {summary.contents ? (
          <>
            <span aria-hidden className="text-neutral-400"> · </span>
            <span data-testid="result-contents">{summary.contents}</span>
          </>
        ) : null}
        <span aria-hidden className="text-neutral-400"> · </span>
        {p.kind === "price" ? (
          <span data-testid="result-price">
            <strong className="font-semibold text-neutral-900">{p.amount}</strong> {p.rest}
          </span>
        ) : p.kind === "quote" ? (
          <span data-testid="result-quote">
            <strong className="font-semibold text-neutral-900">{p.promise}</strong>
            <span className="hidden text-neutral-600 xsmall:inline"> · {p.lead}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 align-middle" data-testid="result-skeleton">
            <span className="sr-only">Checking price and stock…</span>
            <span aria-hidden className="inline-block h-5 w-24 animate-pulse bg-neutral-200 small:h-6" />
            <span aria-hidden className="inline-block h-5 w-40 animate-pulse bg-neutral-100 small:h-6" />
          </span>
        )}
      </p>
      {reviewReasons.length ? (
        <p className="text-sm font-medium text-cardinal-red" data-testid="result-review">
          Engineering review: {reviewReasons.join("; ")}
        </p>
      ) : null}
    </div>
  )
}
