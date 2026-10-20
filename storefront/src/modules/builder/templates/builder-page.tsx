// Server-rendered frame of every builder and content page (spec SEO rules): one question per page
// in the H1, the answer in the first sentence, the configurator below it, citations as footnotes.
//
// Builder pages (with a configurator, David's review Oct 20): the headline sits right on top of the
// configurator, whose result line is the first thing under it, so a buyer reaches the price in one
// screen. The answer paragraph stays second in the document (right after the H1, for search and
// screen readers) but shows below the configurator, as the start of the reading section. `after`
// (e.g. the "we can supply" quote links) closes the page, below the sources.

import type { CitationId } from "@lib/builder/citations"
import { Footnotes } from "@modules/builder/components/footnotes"
import Link from "next/link"
import type { ReactNode } from "react"

export type Crumb = { label: string; href?: string }

export default function BuilderPage({
  countryCode,
  crumbs,
  eyebrow,
  h1,
  answer,
  children,
  content,
  citations,
  jsonLd,
  after,
  testId = "builder-page",
}: {
  countryCode: string
  crumbs: Crumb[]
  eyebrow: string
  h1: string
  /** First paragraph: the answer to the H1's question. */
  answer: ReactNode
  /** The configurator (client island) or the page's main block. */
  children?: ReactNode
  /** Supporting content below the configurator. */
  content?: ReactNode
  citations: readonly CitationId[]
  jsonLd?: Record<string, unknown>
  /** Closes the page, after the sources (e.g. "we can supply" quote links). */
  after?: ReactNode
  testId?: string
}) {
  const crumbsNav = (
    <nav aria-label="Breadcrumb" className="mb-3 flex flex-wrap items-center gap-2 text-sm text-neutral-400 small:mb-6">
      <Link href={`/${countryCode}`} className="hover:text-neutral-900">
        Home
      </Link>
      {crumbs.map((c) => (
        <span key={c.label} className="flex items-center gap-2">
          <span aria-hidden>/</span>
          {c.href ? (
            <Link href={`/${countryCode}${c.href}`} className="hover:text-neutral-900">
              {c.label}
            </Link>
          ) : (
            <span className="text-neutral-900">{c.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
  const eyebrowP = <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-cardinal-red small:mb-3">{eyebrow}</p>
  const reading = (
    <>
      {content ? (
        <section className="px-4 pt-12 xsmall:px-6 small:px-12">
          <div className="mx-auto flex max-w-3xl flex-col gap-6 text-base leading-relaxed text-neutral-800">{content}</div>
        </section>
      ) : null}

      <div className="px-4 pt-12 xsmall:px-6 small:px-12">
        <div className="mx-auto max-w-3xl">
          <Footnotes ids={citations} />
        </div>
      </div>

      {after ? (
        <div className="px-4 pt-10 xsmall:px-6 small:px-12" data-testid="builder-page-after">
          <div className="mx-auto max-w-3xl">{after}</div>
        </div>
      ) : null}
    </>
  )

  if (children) {
    return (
      <div className="bg-neutral-50 pb-24 small:pb-16" data-testid={testId}>
        {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
        <div className="flex flex-col">
          <header className="order-1 bg-white px-4 pt-10 xsmall:px-6 small:px-12 small:pt-10">
            <div className="mx-auto max-w-[1440px]">
              {crumbsNav}
              <div className="hidden xsmall:block">{eyebrowP}</div>
              <h1 className="max-w-4xl text-[1.625rem] font-normal leading-tight tracking-tight text-neutral-900 small:text-5xl" data-testid="page-h1">
                {h1}
              </h1>
            </div>
          </header>
          {/* Second in the document, shown after the configurator. */}
          <section className="order-3 px-4 pt-10 xsmall:px-6 small:px-12" aria-label="Answer">
            <div className="mx-auto max-w-3xl text-base leading-relaxed text-neutral-700 small:text-lg" data-testid="page-answer">
              {answer}
            </div>
          </section>
          <section className="order-2 border-b border-neutral-200 bg-white px-4 pb-8 pt-3 xsmall:px-6 small:px-12 small:pb-12 small:pt-5" aria-label="Configurator">
            <div className="mx-auto max-w-[1440px]">{children}</div>
          </section>
        </div>
        {reading}
      </div>
    )
  }

  return (
    <div className="bg-neutral-50 pb-24 small:pb-16" data-testid={testId}>
      {jsonLd ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} /> : null}
      <header className="border-b border-neutral-200 bg-white px-4 pb-10 pt-10 xsmall:px-6 small:px-12 small:pt-14">
        <div className="mx-auto max-w-[1440px]">
          {crumbsNav}
          {eyebrowP}
          <h1 className="max-w-4xl text-3xl font-normal tracking-tight text-neutral-900 small:text-5xl" data-testid="page-h1">
            {h1}
          </h1>
          <div className="mt-5 max-w-3xl text-base leading-relaxed text-neutral-700 small:text-lg" data-testid="page-answer">
            {answer}
          </div>
        </div>
      </header>

      {reading}
    </div>
  )
}

/** A content section heading + body, styled once. */
export function ContentSection({ title, children, id }: { title: string; children: ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-28">
      <h2 className="mb-3 text-2xl font-normal tracking-tight text-neutral-900">{title}</h2>
      <div className="flex flex-col gap-3 text-neutral-700">{children}</div>
    </section>
  )
}
