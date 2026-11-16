import { BUILDER_TYPES, getBuilder, type BuilderType } from "@lib/cpq/shared"
import { canonicalUrl } from "@lib/builder/page"
import { LeadTimeFacts } from "@modules/builder/components/page-bits"
import BuilderPage from "@modules/builder/templates/builder-page"
import { Metadata } from "next"
import Link from "next/link"

/* /build: the index of the five builders and the two explainers. */

type Props = { params: { countryCode: string } }

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "Build a Kit: CDU Hookup Kits, Row Manifolds, Transition Spools, Strainers, Hoses | Cardinal Cooling Systems",
    description:
      "Data center liquid cooling builders: start from the CDU, manifold or pipe you're connecting and get the bill of materials, Part Number, drawing and price. Instant when stocked; firm quote within 1 business day when welded.",
    alternates: { canonical: canonicalUrl(params.countryCode, "/build") },
  }
}

const BLURB: Record<BuilderType, { question: string; pitch: string; mode: string }> = {
  "cdu-kit": {
    question: "What connects my CDU to the loop?",
    pitch: "Everything between the CDU's supply and return ports and the TCS or facility pipe, per CDU.",
    mode: "Instant when every part is stocked",
  },
  "row-manifold": {
    question: "How is an OCP row manifold built?",
    pitch: "A TCS header with drops at your pitch, built to the OCP guideline, with a spec block for your submittal.",
    mode: "Quote",
  },
  transition: {
    question: "How do I go from tri-clamp to flange, NPT or grooved?",
    pitch: "A welded transition spool, or the stocked adapter that does the same job.",
    mode: "Quote, or Instant for a stocked adapter",
  },
  strainer: {
    question: "Which strainer protects the cold plates?",
    pitch: "A 316L inline tri-clamp strainer, 20 to 100 mesh, with the clamps and gaskets to install it.",
    mode: "Instant when stocked",
  },
  hose: {
    question: "Which hose has tri-clamp ends?",
    pitch: "Stainless braided hose assemblies with tri-clamp, NPT or flange ends and the pressure rating shown.",
    mode: "Instant at standard lengths when stocked",
  },
}

export default function BuildIndexPage({ params }: Props) {
  const { countryCode } = params
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build" }]}
      eyebrow="Builders · Data center liquid cooling"
      h1="What are you connecting?"
      answer={
        <p>
          Start from the equipment you&apos;re installing, a CDU, a row manifold or the jump from sanitary to facility pipe,
          and each builder returns the bill of materials, the Part Number, a drawing and a price: instant when every part is
          stocked, a firm quote within 1 business day when anything is welded or cut to length.
        </p>
      }
      citations={[]}
      testId="build-index"
      content={<LeadTimeFacts />}
    >
      <ul className="grid grid-cols-1 gap-4 xsmall:grid-cols-2 medium:grid-cols-3" data-testid="builder-cards">
        {BUILDER_TYPES.map((t) => {
          const b = getBuilder(t as string)
          const blurb = BLURB[t]
          return (
            <li key={t}>
              <Link
                href={`/${countryCode}${b.path}`}
                className="group flex h-full flex-col gap-2 border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-900"
                data-testid={`builder-card-${t}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-cardinal-red">{b.title}</span>
                <span className="text-lg font-medium text-neutral-900">{blurb.question}</span>
                <span className="text-sm text-neutral-600">{blurb.pitch}</span>
                <span className="mt-auto pt-3 text-xs text-neutral-500">{blurb.mode}</span>
                <span className="text-sm font-semibold text-neutral-900 group-hover:text-cardinal-red">Build it →</span>
              </Link>
            </li>
          )
        })}
        <li>
          <Link
            href={`/${countryCode}/build/connections`}
            className="flex h-full flex-col gap-2 border border-dashed border-neutral-300 bg-white p-5 hover:border-neutral-900"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Explainer</span>
            <span className="text-lg font-medium text-neutral-900">Tri-clamp, I-line, grooved or flanged: which goes where?</span>
            <span className="mt-auto text-sm font-semibold text-neutral-900">Read it →</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/${countryCode}/sanitary-vs-bpe`}
            className="flex h-full flex-col gap-2 border border-dashed border-neutral-300 bg-white p-5 hover:border-neutral-900"
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Explainer</span>
            <span className="text-lg font-medium text-neutral-900">Sanitary stainless or ASME BPE?</span>
            <span className="mt-auto text-sm font-semibold text-neutral-900">Read it →</span>
          </Link>
        </li>
      </ul>
    </BuilderPage>
  )
}
