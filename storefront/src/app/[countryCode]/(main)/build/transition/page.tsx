import { canonicalUrl, decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import BuilderShell from "@modules/builder/components/builder-shell"
import { makeCite } from "@modules/builder/components/footnotes"
import { LeadTimeFacts } from "@modules/builder/components/page-bits"
import BuilderPage, { ContentSection } from "@modules/builder/templates/builder-page"
import { Metadata } from "next"
import Link from "next/link"

/*
  Transition Spool builder (spec Page 3). Always Quote (welded); when the resolver finds a stocked
  adapter that does the same job (resolve `stocked_alternative`), the shell offers it at its
  Instant price. Primary queries: "tri clamp to flange adapter", "tri clamp to grooved",
  "sanitary to NPT adapter 2 inch", "hygienic flange ANSI 150".
*/

type Props = { params: { countryCode: string }; searchParams: SearchParams }

const CITATIONS = ["vertivCdu600", "ocpManifold"] as const

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "Tri-Clamp to Flange, NPT or Grooved: Transition Spool Builder | Cardinal Cooling Systems",
    description:
      "Join a sanitary tri-clamp CDU loop to ANSI 150/300 flange, NPT, grooved or butt-weld pipe: transition spools 1\"–8\", 2\"–72\" long, 316L or 304L, reducing when sizes differ. Stocked adapters (e.g. 2\" sanitary to NPT) at posted prices.",
    alternates: { canonical: canonicalUrl(params.countryCode, "/build/transition") },
  }
}

export default function TransitionPage({ params, searchParams }: Props) {
  const { countryCode } = params
  const { options, ignored } = decodePageOptions("transition", searchParams)
  const Cite = makeCite(CITATIONS)
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build", href: "/build" }, { label: "Transition Spool" }]}
      eyebrow="Transition Spool · Tri-clamp × flange, NPT, grooved"
      h1="How do you connect tri-clamp to a flange, NPT or grooved pipe?"
      answer={
        <p>
          With a transition spool: a welded spool with a sanitary end (tri-clamp, I-line, bevel seat or plain weld) on the
          CDU side and a facility end (ANSI 150 or 300 flange, NPT, grooved or butt-weld pipe) on the other, with a
          concentric reducer when the two sizes differ. When a stocked adapter does the same job, such as a 2&quot; tri-clamp
          × 2&quot; NPT adapter, this page offers it at its posted price instead.
        </p>
      }
      citations={CITATIONS}
      content={
        <>
          <LeadTimeFacts />
          <ContentSection title="Why every loop needs one">
            <p>
              The CDU side of a liquid-cooling loop is sanitary and the facility side usually isn&apos;t. Vertiv&apos;s
              CoolChip CDU 600, for example, connects with stainless hygienic fittings and ships a hose set with hygienic
              flange to ANSI 150
              <Cite id="vertivCdu600" />. Upstream of the CDU, the facility water system is HVAC pipe: flanged or grooved.
              The transition spool is the joint between the two worlds.
            </p>
          </ContentSection>
          <ContentSection title="How it's made">
            <p>
              Sanitary ASTM A270 tube in 316L or 304L, the two ends welded on by GTAW with an inert-gas purge, then cleaned
              and passivated to ASTM A380, the same treatment the OCP guideline asks of TCS pipework
              <Cite id="ocpManifold" />. Sizes 1&quot;–8&quot; OD, 2&quot;–72&quot; face to face. A different size on End B
              adds a concentric reducer automatically.
            </p>
            <p>
              Not sure which end you have?{" "}
              <Link href={`/${countryCode}/build/connections`} className="font-medium text-cardinal-red underline">
                See tri-clamp, I-line, bevel seat, grooved, flanged and NPT side by side
              </Link>
              .
            </p>
          </ContentSection>
        </>
      }
    >
      <BuilderShell type="transition" initialOptions={options} ignored={ignored} drawnDate={drawnDate()} formTitle="Configure your transition" />
    </BuilderPage>
  )
}
