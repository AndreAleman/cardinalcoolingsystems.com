import { builderMetadata } from "@lib/builder/seo"
import { makeCite } from "@modules/builder/components/footnotes"
import { SanitaryGradeSummary } from "@modules/builder/components/page-bits"
import BuilderPage, { ContentSection } from "@modules/builder/templates/builder-page"
import { Metadata } from "next"
import Link from "next/link"

/*
  Sanitary-vs-BPE explainer (spec SEO table "Explainer"): what the OCP guideline asks of TCS
  pipework, what sanitary tube supplies, what ASME BPE adds. Every claim is quoted from a cited
  document or is a number Cardinal stands behind. Primary queries: "sanitary stainless vs BPE",
  "3-A vs BPE fittings".
*/

type Props = { params: { countryCode: string } }

const CITATIONS = ["ocpManifold", "vertivCdu600Spec", "vertivCdu600", "ocpWater", "ocpPg25"] as const

export function generateMetadata({ params }: Props): Metadata {
  return builderMetadata({
    countryCode: params.countryCode,
    title: "Sanitary Stainless vs ASME BPE for Liquid Cooling Loops",
    description:
      "What the OCP row-manifold guideline asks of TCS pipework (304 minimum, inert-atmosphere welding, ASTM A380 treatment), what 304L/316L sanitary tube supplies, and what ASME BPE adds. BPE is available when a project spec names it.",
    path: "/sanitary-vs-bpe",
  })
}

export default function SanitaryVsBpePage({ params }: Props) {
  const { countryCode } = params
  const Cite = makeCite(CITATIONS)
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Sanitary vs BPE" }]}
      eyebrow="Explainer · Sanitary grade"
      h1="Sanitary stainless or ASME BPE: which does a liquid cooling loop need?"
      answer={<SanitaryGradeSummary countryCode={countryCode} ocpRef={<Cite id="ocpManifold" />} />}
      citations={CITATIONS}
      testId="sanitary-vs-bpe-page"
      content={
        <>
          <ContentSection title="What the OCP guideline asks for">
            <p>
              The OCP guideline for pre-commission preparation of TCS row manifolds (January 2025) sets these assumptions
              for row-manifold pipework
              <Cite id="ocpManifold" />:
            </p>
            <ul className="list-disc pl-5">
              <li>&ldquo;Pipework materials are expected to be stainless steel, minimum grade 304.&rdquo;</li>
              <li>
                Internal surfaces &ldquo;appropriately treated as per mechanical standards (for example ASTM A380/A380M-25
                &hellip;)&rdquo;: cleaned, descaled, pickled and passivated.
              </li>
              <li>
                Welding &ldquo;as per &hellip; AWS D10.18 Pipe welding (stainless steel)&rdquo;, &ldquo;under inert
                atmosphere conditions to minimize heat tint&rdquo;.
              </li>
              <li>Fill points that &ldquo;will typically be 1&rdquo; sanitary fittings&rdquo;.</li>
              <li>Loop backs of peroxide-cured EPDM or flexible stainless steel.</li>
            </ul>
            <p>
              Vertiv describes its CoolChip CDU 600 the same way: internal pipework is &ldquo;S304/S316 stainless steel and
              is put through a chemical cleaning and passivation process&rdquo;
              <Cite id="vertivCdu600Spec" />, and both circuits connect with 2-1/2&quot; (DN65) sanitary flanges
              <Cite id="vertivCdu600" />. None of these documents names ASME BPE or a surface-roughness value.
            </p>
          </ContentSection>

          <ContentSection title="What Cardinal supplies">
            <ul className="list-disc pl-5">
              <li>304L or 316L sanitary tube, 20 Ra ID / 32 Ra OD.</li>
              <li>Mill test reports (MTRs) by heat number.</li>
              <li>Passivation certificates available on fabricated parts (spools and manifolds).</li>
              <li>
                1&quot; tri-clamp fittings, the fill-point size the OCP guideline names
                <Cite id="ocpManifold" />.
              </li>
            </ul>
          </ContentSection>

          <ContentSection title="What ASME BPE adds">
            <p>
              ASME BPE (Bioprocessing Equipment) is written for pharmaceutical and biotech process systems. It adds tighter
              surface-finish limits, electropolishing and full weld documentation. A closed cooling loop does not normally
              require them, and none of the OCP or Vertiv documents cited on this page asks for them.
            </p>
          </ContentSection>

          <ContentSection title="Coolant chemistry: 304L or 316L, and which gasket">
            <p>
              Use 316L where chlorides are present or the inhibitor package is unknown. The OCP guideline for water-based
              fluids sets the chloride limit at &lt; 50 ppm for 304 stainless and &lt; 500 ppm for 316 stainless, and lists
              304L or 316L as preferred
              <Cite id="ocpWater" />. For PG25 propylene glycol, use peroxide-cured EPDM gaskets: the OCP PG25 guideline
              recommends them because sulfur-cured EPDM can add sulfate to the fluid over time
              <Cite id="ocpPg25" />. Peroxide-cured EPDM is the default gasket in the CDU hookup kit builder.
            </p>
          </ContentSection>

          <ContentSection title="When to ask for BPE">
            <p>
              When a project spec names ASME BPE, we supply it &mdash;{" "}
              <Link
                href={`/${countryCode}/contact?category=${encodeURIComponent("ASME BPE")}`}
                className="font-medium text-cardinal-red underline"
              >
                ask us
              </Link>
              , with the spec section and the quantities.
            </p>
          </ContentSection>

          <ContentSection title="Build with sanitary">
            <p>
              Each builder&apos;s spec block lists the alloy, finish, weld method, cleaning and certificates for your
              submittal.{" "}
              <Link href={`/${countryCode}/build`} className="font-medium text-cardinal-red underline">
                Start a build
              </Link>{" "}
              or{" "}
              <Link href={`/${countryCode}/build/connections`} className="font-medium text-cardinal-red underline">
                compare connections
              </Link>
              .
            </p>
          </ContentSection>
        </>
      }
    />
  )
}
