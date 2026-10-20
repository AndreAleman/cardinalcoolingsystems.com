import { accountPage, kitLinkFor } from "@lib/builder/account-pages"
import { CITATIONS } from "@lib/builder/citations"
import { builderMetadata } from "@lib/builder/seo"
import { decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import { getCatalogCut } from "@lib/data/catalog-cut"
import { convertToLocale } from "@lib/util/money"
import BuilderShell from "@modules/builder/components/builder-shell"
import AccountPageView from "@modules/builder/components/account-page-view"
import { GlycolNote, LeadTimeFacts, SanitaryGradeSummary } from "@modules/builder/components/page-bits"
import EmailOff from "@modules/common/components/email-off"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

/*
  Per-account pages (plan B15): one template, data in lib/builder/account-pages.ts. Unlisted:
  noindex, nofollow, and not in the sitemap. A verified connection pre-fills the CDU kit; an
  empty one shows the data-center catalog cut at posted prices and asks for connection sizes.
*/

type Props = { params: { countryCode: string; slug: string }; searchParams: SearchParams }

const NO_INDEX = { index: false, follow: false, nocache: true } as const

export function generateMetadata({ params }: Props): Metadata {
  const page = accountPage(params.slug)
  if (!page) return { title: "Cardinal Cooling Systems", robots: NO_INDEX }
  const conn = page.connection
  return builderMetadata({
    countryCode: params.countryCode,
    title: conn ? `${conn.equipment} hookup kit for ${page.company}` : `Sanitary connection parts for ${page.company}`,
    description: conn
      ? `Prepared for ${page.company}'s purchasing and engineering team: the hookup kit for the ${conn.equipment} (${conn.label}), priced live when every part is stocked.`
      : `Prepared for ${page.company}'s purchasing and engineering team: tri-clamp fittings, valves and strainers for data center liquid cooling at posted prices. Send your connection sizes and we'll price your exact BOM in 48 hours.`,
    path: `/for/${page.slug}`,
    robots: NO_INDEX,
  })
}

const STANDARD_SIZES =
  '1"–4" tri-clamp ferrules, clamps, gaskets, 90s and tees; 2"–4" butterfly and ball valves; 316L strainers.'
const OCP_MANIFOLD = CITATIONS.ocpManifold
const DAVID_EMAIL = "aleman@cardinalcoolingsystems.com"

export default async function AccountLandingPage({ params, searchParams }: Props) {
  const { countryCode, slug } = params
  const page = accountPage(slug)
  if (!page) notFound()

  const conn = page.connection
  const cut = conn ? [] : await getCatalogCut(countryCode)
  const contactHref = `/${countryCode}/contact?category=${encodeURIComponent(`Connection sizes for ${page.company}`)}`

  return (
    <div className="bg-neutral-50 pb-24 small:pb-16" data-testid="account-page" data-slug={page.slug}>
      <header className="border-b border-neutral-200 bg-white px-4 pb-10 pt-10 xsmall:px-6 small:px-12 small:pt-14">
        <div className="mx-auto max-w-[1440px]">
          <AccountPageView slug={page.slug} company={page.company} />
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cardinal-red" data-testid="account-prepared-for">
            Prepared for {page.company}&apos;s purchasing and engineering team
          </p>
          <h1 className="max-w-4xl text-3xl font-normal tracking-tight text-neutral-900 small:text-5xl">
            {conn ? `The hookup kit for your ${conn.equipment}` : `Sanitary connection parts for ${page.company}, at posted prices`}
          </h1>
          <div className="mt-5 max-w-3xl text-base leading-relaxed text-neutral-700 small:text-lg">
            {page.trigger ? (
              <p className="mb-3" data-testid="account-trigger">
                {page.trigger.text}{" "}
                <a href={page.trigger.source.url} target="_blank" rel="noopener noreferrer" className="text-sm underline">
                  ({page.trigger.source.title})
                </a>
              </p>
            ) : null}
            {conn ? (
              <p data-testid="account-connection">
                From your datasheet: {conn.label} (
                <a href={conn.source.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {conn.source.title}
                </a>
                ). The kit below is pre-filled for it and prices live when every part is stocked.
              </p>
            ) : (
              <div data-testid="account-ask" className="flex flex-col gap-2">
                <p>
                  Standard sizes: {STANDARD_SIZES} Parts with a posted price show it below; anything without one is quoted.
                </p>
                <p className="font-medium text-neutral-900">
                  Send us your connection sizes and we&apos;ll price your exact BOM in 48 hours.
                </p>
              </div>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {/* One quote action per page: with a known connection it is the builder's Add to Quote List below. */}
            {conn ? (
              <Link href={`/${countryCode}${kitLinkFor(conn)}`} className="inline-flex h-12 items-center border border-neutral-900 px-6 text-sm font-semibold text-neutral-900 hover:bg-neutral-100">
                Open the full kit builder
              </Link>
            ) : (
              <Link href={contactHref} className="inline-flex h-12 items-center bg-cardinal-red px-6 text-sm font-semibold text-white hover:bg-cardinal-red-hover" data-testid="account-send-sizes">
                Send your connection sizes
              </Link>
            )}
          </div>
          <p className="mt-4 text-sm text-neutral-600" data-testid="account-contact">
            Your contact: David Aleman,{" "}
            <EmailOff email={DAVID_EMAIL} className="font-medium text-cardinal-red underline" subject={`Cardinal parts for ${page.company}`} />
          </p>
        </div>
      </header>

      <section className="px-4 pt-8 xsmall:px-6 small:px-12">
        <div className="mx-auto max-w-[1440px]">
          {conn ? (
            <BuilderShell
              type="cdu-kit"
              initialOptions={decodePageOptions("cdu-kit", searchParams, { cdu: conn.cdu ?? "none", port: conn.port }).options}
              ignored={[]}
              drawnDate={drawnDate()}
              formTitle={`Configure the ${page.company} kit`}
              formFooter={<GlycolNote />}
            />
          ) : (
            <CatalogCut groups={cut} countryCode={countryCode} />
          )}
        </div>
      </section>

      <section className="px-4 pt-10 xsmall:px-6 small:px-12">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <section aria-label="Sanitary or BPE" className="text-base leading-relaxed text-neutral-700">
            <h2 className="mb-3 text-2xl font-normal tracking-tight text-neutral-900">Sanitary or ASME BPE?</h2>
            <SanitaryGradeSummary
              countryCode={countryCode}
              readMore
              ocpRef={
                <>
                  {" "}
                  (
                  <a href={OCP_MANIFOLD.url} target="_blank" rel="noopener noreferrer" className="underline">
                    OCP TCS row-manifold guideline, §1.4
                  </a>
                  )
                </>
              }
            />
          </section>
          <LeadTimeFacts />
        </div>
      </section>
    </div>
  )
}

function CatalogCut({
  groups,
  countryCode,
}: {
  groups: Awaited<ReturnType<typeof getCatalogCut>>
  countryCode: string
}) {
  if (!groups.length) {
    return (
      <p className="border border-neutral-200 bg-white p-6 text-sm text-neutral-700" data-testid="catalog-cut-empty">
        Posted prices are not available right now. Send us your connection sizes with the button above and we&apos;ll
        price your exact BOM in 48 hours.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-6" data-testid="catalog-cut">
      {groups.map((g) => (
        <section key={g.key} className="border border-neutral-200 bg-white" aria-label={g.label}>
          <h2 className="border-b border-neutral-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-neutral-900">{g.label}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th scope="col" className="px-4 py-2 font-medium">Part</th>
                  <th scope="col" className="px-4 py-2 font-medium">SKU</th>
                  <th scope="col" className="px-4 py-2 text-right font-medium">Posted price</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.sku} className="border-t border-neutral-100" data-testid="catalog-cut-row">
                    <td className="px-4 py-3">
                      {r.handle ? (
                        <Link href={`/${countryCode}/products/${r.handle}`} className="underline hover:text-cardinal-red">
                          {r.title}
                        </Link>
                      ) : (
                        r.title
                      )}
                      {r.variantTitle ? <span className="block text-xs text-neutral-500">{r.variantTitle}</span> : null}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{r.sku}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {r.price !== null ? convertToLocale({ amount: r.price, currency_code: r.currency }) : "Quote"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  )
}
