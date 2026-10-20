import { canonicalUrl, decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import BuilderShell from "@modules/builder/components/builder-shell"
import { GlycolNote, KIT_WE_CAN_SUPPLY, WeCanSupply } from "@modules/builder/components/page-bits"
import BuilderPage from "@modules/builder/templates/builder-page"
import CduKitContent, { CDU_KIT_CITATIONS } from "@modules/builder/templates/cdu-kit-content"
import { Metadata } from "next"

/*
  CDU Hookup Kit builder (spec Page 1). Server-rendered question, answer and citations; the
  configurator is a client island. Primary queries (spec SEO table): "CDU piping connections",
  "coolant distribution unit tri-clamp", "1.5 tri clamp ferrule 316L", "CDU hose kit".
*/

type Props = { params: { countryCode: string }; searchParams: SearchParams }

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "CDU Piping Connections: Tri-Clamp Hookup Kit & CDU Hose Kit Builder | Cardinal Cooling Systems",
    description:
      "Build the piping between a coolant distribution unit and the TCS or facility pipe: 1\"–4\" tri-clamp 316L ferrules, clamps, gaskets, valves, strainer, spool or CDU hose kit. Live price when every part is stocked.",
    alternates: { canonical: canonicalUrl(params.countryCode, "/build/cdu-kit") },
  }
}

export default function CduKitPage({ params, searchParams }: Props) {
  const { countryCode } = params
  const { options, ignored } = decodePageOptions("cdu-kit", searchParams)
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build", href: "/build" }, { label: "CDU Hookup Kit" }]}
      eyebrow="CDU Hookup Kit · Tri-clamp · 304L / 316L"
      h1="What piping connections does a CDU need?"
      answer={
        <p>
          A CDU needs a hookup kit for each supply and return port: the run to the facility or TCS pipe (a welded spool or a
          stainless braided hose), the tri-clamp ferrules, clamps and gaskets at every joint, any isolation valves and
          supply-side strainer, and an adapter when the far end isn&apos;t tri-clamp. Pick your CDU port below and get the bill
          of materials, priced live when every part is stocked.
        </p>
      }
      citations={CDU_KIT_CITATIONS}
      content={<CduKitContent countryCode={countryCode} />}
      after={<WeCanSupply countryCode={countryCode} items={KIT_WE_CAN_SUPPLY} />}
    >
      <BuilderShell
        type="cdu-kit"
        initialOptions={options}
        ignored={ignored}
        drawnDate={drawnDate()}
        formTitle="Configure your kit"
        formFooter={<GlycolNote />}
      />
    </BuilderPage>
  )
}
