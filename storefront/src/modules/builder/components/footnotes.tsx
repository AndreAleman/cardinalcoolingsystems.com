// Citations as numbered footnotes (server component). A page lists its citation ids in first-use
// order; <Cite> renders the superscript link, <Footnotes> the list at the bottom.

import { CITATIONS, footnoteNumbers, type CitationId } from "@lib/builder/citations"

export function makeCite(ids: readonly CitationId[]) {
  const n = footnoteNumbers(ids)
  return function Cite({ id }: { id: CitationId }) {
    return (
      <sup className="ml-0.5 text-[0.7em]">
        <a href={`#fn-${id}`} className="text-cardinal-red no-underline hover:underline" aria-label={`Source ${n[id]}`}>
          [{n[id]}]
        </a>
      </sup>
    )
  }
}

export function Footnotes({ ids }: { ids: readonly CitationId[] }) {
  const n = footnoteNumbers(ids)
  const unique = Object.keys(n) as CitationId[]
  if (!unique.length) return null
  return (
    <section aria-label="Sources" className="border-t border-neutral-200 pt-6" data-testid="footnotes">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sources</h2>
      <ol className="mt-3 flex flex-col gap-2 text-sm text-neutral-700">
        {unique.map((id) => (
          <li key={id} id={`fn-${id}`} className="flex gap-2">
            <span className="tabular-nums text-neutral-500">{n[id]}.</span>
            <span>
              <a href={CITATIONS[id].url} target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-900">
                {CITATIONS[id].title}
              </a>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
