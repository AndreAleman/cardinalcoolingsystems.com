import { canonicalUrl } from "@lib/builder/page"
import { makeCite } from "@modules/builder/components/footnotes"
import BuilderPage, { ContentSection } from "@modules/builder/templates/builder-page"
import { Metadata } from "next"
import Link from "next/link"

/*
  Sanitary-vs-BPE explainer (spec SEO table "Explainer"): the sanitary-grade argument, written once.
  Primary queries: "sanitary stainless vs BPE", "3-A vs BPE fittings".
*/

type Props = { params: { countryCode: string } }

const CITATIONS = ["ocpManifold"] as const

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "Sanitary Stainless vs ASME BPE: 3-A vs BPE Fittings for Liquid Cooling | Cardinal Cooling Systems",
    description:
      "3-A certified 304/316L sanitary stainless gives a liquid cooling loop the cleanability and corrosion resistance of ASME BPE without the documentation premium. BPE is available on request at volume.",
    alternates: { canonical: canonicalUrl(params.countryCode, "/sanitary-vs-bpe") },
  }
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
      answer={
        <p>
          Sanitary: 3-A certified 304/316L sanitary stainless gives a liquid cooling loop the cleanability and corrosion
          resistance of ASME BPE without the documentation premium, and BPE is available on request at volume.
        </p>
      }
      citations={CITATIONS}
      testId="sanitary-vs-bpe-page"
      content={
        <>
          <ContentSection title="What the loop actually asks for">
            <p>
              The OCP guideline for TCS row manifolds asks for stainless steel, minimum grade 304, inert-gas welding, surface
              treatment to ASTM A380 and 1-inch sanitary fittings as typical fill points
              <Cite id="ocpManifold" />. Sanitary tube and fittings meet every one of those: 304L or 316L, polished ID,
              orbital-weldable ferrules, tri-clamp fill and drain points.
            </p>
          </ContentSection>
          <ContentSection title="3-A sanitary vs BPE fittings">
            <p>
              Both are polished stainless with tri-clamp ends that fit each other. 3-A sanitary is built for cleanability in
              food and dairy service. ASME BPE (Bioprocessing Equipment) adds tighter surface-finish limits and the paperwork
              a pharmaceutical validation needs: finish verification and material traceability on every component.
            </p>
            <p>
              A closed cooling loop isn&apos;t validated like a drug process. It needs clean, corrosion-resistant pipe that
              passivates well, which sanitary grade delivers. The BPE paperwork is what you pay extra for.
            </p>
          </ContentSection>
          <ContentSection title="When to ask for BPE">
            <p>
              When your owner&apos;s spec calls for it by name, or your project already carries BPE documentation. Tell us the
              quantity on your quote request; BPE is available on request at volume.
            </p>
          </ContentSection>
          <ContentSection title="Build with sanitary">
            <p>
              Every builder spec block states the grade plainly: 3-A sanitary construction, ASME BPE documentation on request.{" "}
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
