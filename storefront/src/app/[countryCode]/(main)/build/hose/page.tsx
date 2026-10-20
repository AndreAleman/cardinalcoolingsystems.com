import { HOSE_SIZES, HOSE_STOCK_LENGTHS_IN, hoseRatedPsi, tubeSize } from "@lib/cpq/shared"
import { decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import BuilderShell from "@modules/builder/components/builder-shell"
import { makeCite } from "@modules/builder/components/footnotes"
import { LeadTimeFacts } from "@modules/builder/components/page-bits"
import BuilderPage, { ContentSection } from "@modules/builder/templates/builder-page"
import { builderMetadata } from "@lib/builder/seo"
import { Metadata } from "next"
import Link from "next/link"

/*
  Hose assembly builder (spec Page 4). Instant at a stocked standard length with the standard
  overbraid (isStandardHose), Quote otherwise; no hose SKU exists today, so it resolves Quote until
  one is published (B1). Primary queries: "stainless braided hose tri clamp ends", "CDU hose assembly".
*/

type Props = { params: { countryCode: string }; searchParams: SearchParams }

const CITATIONS = ["vertivCdu600Spec"] as const

export function generateMetadata({ params }: Props): Metadata {
  return builderMetadata({
    countryCode: params.countryCode,
    title: "CDU Hose Assembly Builder: Stainless Braided Hose with Tri-Clamp Ends",
    description:
      "Build a CDU hose assembly: stainless braided hose with tri-clamp ends (or tri-clamp × NPT or ANSI 150 flange), 1/2\"–4\", 12\"–240\", overbraid, silicone or PTFE-lined, armor or fire sleeve. Pressure rating shown.",
    path: "/build/hose",
  })
}

export default function HosePage({ params, searchParams }: Props) {
  const { countryCode } = params
  const { options, ignored } = decodePageOptions("hose", searchParams)
  const Cite = makeCite(CITATIONS)
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build", href: "/build" }, { label: "Hose Assembly" }]}
      eyebrow="Hose assembly · Stainless overbraid · Tri-clamp ends"
      h1="What hose connects a CDU with tri-clamp ends?"
      answer={
        <p>
          A stainless braided hose assembly with tri-clamp ends: 316 stainless corrugated hose under a stainless overbraid,
          1/2&quot;–4&quot;, 12&quot;–240&quot; long, tri-clamp both ends or tri-clamp × NPT or ANSI 150 flange. Configure
          it below; standard lengths ({HOSE_STOCK_LENGTHS_IN.join(", ")} in) price instantly once stocked, and any other
          length is quoted within 1 business day.
        </p>
      }
      citations={CITATIONS}
      content={
        <>
          <LeadTimeFacts />
          <ContentSection title="Pressure ratings">
            <p>
              The working pressure shown for a configuration is the lowest of the hose, its cover and the tri-clamp joint.
              With the standard stainless overbraid:
            </p>
            <div className="overflow-x-auto border border-neutral-200 bg-white">
              <table className="w-full text-left text-sm" data-testid="hose-pressure-table">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">Size</th>
                    <th scope="col" className="px-4 py-2 font-medium">Working pressure</th>
                  </tr>
                </thead>
                <tbody>
                  {HOSE_SIZES.map((s) => (
                    <tr key={s} className="border-t border-neutral-100">
                      <td className="px-4 py-3">{tubeSize(s).label}</td>
                      <td className="px-4 py-3">{hoseRatedPsi({ size: s, cover: "braid" })} psi</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-neutral-500">Ratings are confirmed on your quote against the hose maker&apos;s data.</p>
          </ContentSection>
          <ContentSection title="Lead time">
            <p>
              Vertiv offers stainless overbraid hose sets as a ship-loose option for its CDU 600
              <Cite id="vertivCdu600Spec" />. Stocked standard lengths here ship in 1–2
              business days. The{" "}
              <Link href={`/${countryCode}/build/cdu-kit`} className="font-medium text-cardinal-red underline">
                CDU hookup kit
              </Link>{" "}
              uses this hose when you pick a flexible run.
            </p>
          </ContentSection>
        </>
      }
    >
      <BuilderShell type="hose" initialOptions={options} ignored={ignored} drawnDate={drawnDate()} formTitle="Configure your hose" />
    </BuilderPage>
  )
}
