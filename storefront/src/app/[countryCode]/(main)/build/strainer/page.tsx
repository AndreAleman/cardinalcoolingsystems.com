import { ASSEMBLIES } from "@lib/cpq/shared"
import { decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import BuilderShell from "@modules/builder/components/builder-shell"
import { makeCite } from "@modules/builder/components/footnotes"
import { LeadTimeFacts } from "@modules/builder/components/page-bits"
import BuilderPage, { ContentSection } from "@modules/builder/templates/builder-page"
import { builderMetadata } from "@lib/builder/seo"
import { Metadata } from "next"
import Link from "next/link"

/*
  Strainer spool builder (spec Page 4). A 316L inline tri-clamp strainer plus the clamps and
  gaskets to install it. Instant only when every part is stocked (B1); no strainer SKU exists
  today (cardinal-builder-sku-gaps.md), so it resolves Quote until one is published.
  Primary queries: "316L sanitary strainer data center", "liquid cooling loop strainer 100 mesh".
*/

type Props = { params: { countryCode: string }; searchParams: SearchParams }

const CITATIONS = ["ocpManifold"] as const

export function generateMetadata({ params }: Props): Metadata {
  return builderMetadata({
    countryCode: params.countryCode,
    title: "316L Sanitary Strainer Builder for Liquid Cooling Loops (20–100 Mesh)",
    description:
      "Configure a 316L inline tri-clamp strainer for a liquid cooling loop: 1\"–6\", short or long body, 20, 40 or 100 mesh, isolation valves and differential-pressure ports, with the clamps and gaskets to install it.",
    path: "/build/strainer",
  })
}

export default function StrainerPage({ params, searchParams }: Props) {
  const { countryCode } = params
  const { options, ignored } = decodePageOptions("strainer", searchParams)
  const Cite = makeCite(CITATIONS)
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build", href: "/build" }, { label: "Strainer" }]}
      eyebrow="Strainer spool · 316L · Tri-clamp"
      h1="Does a liquid cooling loop need a strainer?"
      answer={
        <p>
          Yes: the OCP guideline extends cleanliness requirements to fittings and terminal units
          <Cite id="ocpManifold" />, and cold-plate channels run around 100 microns, so a strainer upstream of the CDU is
          the cheapest insurance in the loop. Configure a 316L inline tri-clamp strainer below, with the clamps and gaskets
          to install it.
        </p>
      }
      citations={CITATIONS}
      content={
        <>
          <LeadTimeFacts />
          <ContentSection title="Which mesh">
            <div className="overflow-x-auto border border-neutral-200 bg-white">
              <table className="w-full text-left text-sm" data-testid="mesh-table">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-medium">Mesh</th>
                    <th scope="col" className="px-4 py-2 font-medium">Opening</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSEMBLIES.strainer.mesh.map((m) => (
                    <tr key={m.mesh} className="border-t border-neutral-100">
                      <td className="px-4 py-3">{m.mesh} mesh</td>
                      <td className="px-4 py-3">{m.micron} µm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>
              Pick the screen against the smallest passage it protects. Add differential-pressure ports to see when the
              screen needs cleaning, and isolation valves either side to pull it without draining the loop.
            </p>
          </ContentSection>
          <ContentSection title="Part of the CDU kit">
            <p>
              The{" "}
              <Link href={`/${countryCode}/build/cdu-kit`} className="font-medium text-cardinal-red underline">
                CDU hookup kit
              </Link>{" "}
              adds this strainer on the supply side at the CDU&apos;s port size.
            </p>
          </ContentSection>
        </>
      }
    >
      <BuilderShell type="strainer" initialOptions={options} ignored={ignored} drawnDate={drawnDate()} formTitle="Configure your strainer" />
    </BuilderPage>
  )
}
