import { accountPage, kitLinkFor } from "@lib/builder/account-pages"
import { canonicalUrl, decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import { getCatalogCut } from "@lib/data/catalog-cut"
import { convertToLocale } from "@lib/util/money"
import BuilderShell from "@modules/builder/components/builder-shell"
import { GlycolNote, LeadTimeFacts } from "@modules/builder/components/page-bits"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

/*
  Per-account pages (plan B15): one template, data in lib/builder/account-pages.ts. Unlisted:
  noindex, nofollow, and not in the sitemap. A verified connection pre-fills the CDU kit; an
  empty one shows the data-center catalog cut at posted prices and asks for connection sizes.
*/

type Props = { params: { countryCode: string; slug: string }; searchParams: SearchParams }

export function generateMetadata({ params }: Props): Metadata {
  const page = accountPage(params.slug)
  return {
    title: page ? `${page.company}: liquid cooling connections at posted prices | Cardinal Cooling Systems` : "Cardinal Cooling Systems",
    robots: { index: false, follow: false, nocache: true },
    alternates: { canonical: canonicalUrl(params.countryCode, `/for/${params.slug}`) },
  }
}

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
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-cardinal-red">For {page.company}</p>
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
              <p data-testid="account-ask">
                Tri-clamp ferrules, clamps, gaskets, elbows, tees and valves for data center liquid cooling, at the prices we
                post. Send us your connection sizes and we&apos;ll price an exact BOM in 48 hours.
              </p>
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {conn ? (
              <Link href={`/${countryCode}${kitLinkFor(conn)}`} className="inline-flex h-12 items-center bg-neutral-900 px-6 text-sm font-semibold text-white hover:bg-neutral-700">
                Open the full kit builder
              </Link>
            ) : null}
            <Link href={contactHref} className="inline-flex h-12 items-center bg-cardinal-red px-6 text-sm font-semibold text-white hover:bg-cardinal-red-hover" data-testid="account-send-sizes">
              Send your connection sizes
            </Link>
          </div>
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
            <CatalogCut groups={cut} contactHref={contactHref} countryCode={countryCode} />
          )}
        </div>
      </section>

      <section className="px-4 pt-10 xsmall:px-6 small:px-12">
        <div className="mx-auto max-w-3xl">
          <LeadTimeFacts />
        </div>
      </section>
    </div>
  )
}

function CatalogCut({
  groups,
  contactHref,
  countryCode,
}: {
  groups: Awaited<ReturnType<typeof getCatalogCut>>
  contactHref: string
  countryCode: string
}) {
  if (!groups.length) {
    return (
      <p className="border border-neutral-200 bg-white p-6 text-sm text-neutral-700" data-testid="catalog-cut-empty">
        <Link href={contactHref} className="font-semibold text-cardinal-red underline">
          Send your connection sizes
        </Link>{" "}
        and we&apos;ll price an exact BOM in 48 hours.
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
