import { ASSEMBLIES } from "@lib/cpq/shared"
import { canonicalUrl, decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import BuilderShell from "@modules/builder/components/builder-shell"
import { makeCite } from "@modules/builder/components/footnotes"
import { LeadTimeFacts, MANIFOLD_WE_CAN_SUPPLY, WeCanSupply } from "@modules/builder/components/page-bits"
import BuilderPage, { ContentSection } from "@modules/builder/templates/builder-page"
import { Metadata } from "next"
import Link from "next/link"

/*
  Row Manifold builder (spec Page 2). Always Quote. Reads like the OCP TCS row-manifold guideline
  with a price attached. Primary queries: "OCP row manifold", "TCS manifold stainless", "liquid
  cooling manifold 316L", "data center manifold passivation ASTM A380".
*/

type Props = { params: { countryCode: string }; searchParams: SearchParams }

const CITATIONS = ["ocpManifold", "titan"] as const

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "OCP Row Manifold Builder: TCS Manifold, Stainless 316L, ASTM A380 | Cardinal Cooling Systems",
    description:
      "Configure a TCS row manifold built to the OCP guideline: 316L or 304L stainless, inert-gas welded, passivated to ASTM A380, 1\" sanitary fill points, hydro test and MTRs. Drawing, Part Number and spec block; firm quote within 1 business day.",
    alternates: { canonical: canonicalUrl(params.countryCode, "/build/row-manifold") },
  }
}

export default function RowManifoldPage({ params, searchParams }: Props) {
  const { countryCode } = params
  const { options, ignored } = decodePageOptions("row-manifold", searchParams)
  const Cite = makeCite(CITATIONS)
  const m = ASSEMBLIES.manifold
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build", href: "/build" }, { label: "Row Manifold" }]}
      eyebrow="TCS Row Manifold · OCP guideline · Quote"
      h1="How is an OCP TCS row manifold built?"
      answer={
        <p>
          An OCP TCS row manifold is stainless steel, minimum grade 304, inert-gas welded, cleaned and passivated to ASTM
          A380, with 1-inch sanitary fittings as its fill points
          <Cite id="ocpManifold" />; Cardinal builds every row manifold to that guideline, in 316L by default. Set the
          header, drops and ends below for a drawing, a Part Number, a paste-ready spec block and a firm quote within 1
          business day.
        </p>
      }
      citations={CITATIONS}
      content={
        <>
          <LeadTimeFacts />
          <ContentSection title="Built to the OCP guideline">
            <p>
              The OCP guideline for pre-commission preparation of TCS row manifolds states that &ldquo;pipework materials are
              expected to be stainless steel, minimum grade 304&rdquo;
              <Cite id="ocpManifold" />. It calls for inert-gas welding, surface treatment to ASTM A380 and 1-inch sanitary
              fittings as typical fill points. Every manifold here is built that way:
            </p>
            <ul className="list-disc pl-5">
              <li>316L sanitary tube (304L option), 32 Ra ID standard, 20 Ra optional.</li>
              <li>Orbital or manual GTAW with an argon purge; cleaned, pickled and passivated to ASTM A380.</li>
              <li>1&quot; sanitary tri-clamp fill point, 0.5&quot; drain and an air vent, on by default.</li>
              <li>
                Hydrostatic test at {m.hydro_test_psig} psig with a certificate, and MTRs by heat number, included.
                Passivation certificate and weld map on request.
              </li>
            </ul>
          </ContentSection>
          <ContentSection title="Header and drops">
            <p>
              Headers come in 3&quot;, 4&quot;, 6&quot; and 8&quot;; 4&quot; is the most common in data center loops
              <Cite id="titan" />. Drops are 1&quot; (the OCP default) or 1.5&quot; at your pitch, finished as a tri-clamp
              ferrule, a sanitary branch with an isolation ball valve, or a UQD-ready stub for the quick disconnect you
              specify. Supply and return are built as a pair unless you say otherwise.
            </p>
          </ContentSection>
          <ContentSection title="What this page doesn't configure">
            <p>
              Quick disconnects, leak-detection trays and mounting hardware are quoted separately. Tell us what you need and
              we&apos;ll add it to the quote, or{" "}
              <Link href={`/${countryCode}/build/cdu-kit`} className="font-medium text-cardinal-red underline">
                build the CDU hookup kit
              </Link>{" "}
              that feeds the manifold.
            </p>
          </ContentSection>
        </>
      }
    >
      <BuilderShell
        type="row-manifold"
        initialOptions={options}
        ignored={ignored}
        drawnDate={drawnDate()}
        formTitle="Configure your manifold"
        formFooter={<WeCanSupply countryCode={countryCode} items={MANIFOLD_WE_CAN_SUPPLY} />}
      />
    </BuilderPage>
  )
}
