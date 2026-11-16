import { canonicalUrl, decodePageOptions, drawnDate, type SearchParams } from "@lib/builder/page"
import { makeCite } from "@modules/builder/components/footnotes"
import BuilderShell from "@modules/builder/components/builder-shell"
import { GlycolNote, KIT_WE_CAN_SUPPLY, WeCanSupply } from "@modules/builder/components/page-bits"
import BuilderPage from "@modules/builder/templates/builder-page"
import CduKitContent, { CDU_KIT_CITATIONS } from "@modules/builder/templates/cdu-kit-content"
import { Metadata } from "next"

/*
  Boyd 10U CDU connection kit (plan B13, spec "Second layer"): the kit builder pre-filled with the
  Boyd 10U, whose 1.5" tri-clamp ports are read from Boyd's datasheet. Own H1 and copy; the
  configuration still shares as /build/cdu-kit?…&cdu=boyd-10u.
*/

type Props = { params: { countryCode: string }; searchParams: SearchParams }

export function generateMetadata({ params }: Props): Metadata {
  return {
    title: "Boyd 10U CDU Connection Kit: 1.5\" Tri-Clamp Hookup Kit | Cardinal Cooling Systems",
    description:
      "The hookup kit for a Boyd 10U CDU: 1.5\" tri-clamp 316L ferrules, heavy-duty clamps, EPDM gaskets, valves, strainer and spool or braided hose to the TCS or facility pipe. Live price when every part is stocked.",
    alternates: { canonical: canonicalUrl(params.countryCode, "/build/cdu-kit/boyd-10u") },
  }
}

export default function Boyd10uKitPage({ params, searchParams }: Props) {
  const { countryCode } = params
  const { options, ignored } = decodePageOptions("cdu-kit", searchParams, { cdu: "boyd-10u", port: "tc150" })
  const Cite = makeCite(CDU_KIT_CITATIONS)
  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build", href: "/build" }, { label: "CDU Hookup Kit", href: "/build/cdu-kit" }, { label: "Boyd 10U" }]}
      eyebrow='Boyd 10U CDU · 1.5" tri-clamp'
      h1="What hookup kit does a Boyd 10U CDU need?"
      answer={
        <p>
          A Boyd 10U CDU needs a 1.5-inch tri-clamp hookup kit: Boyd&apos;s datasheet lists 1.5-inch sanitary (tri-clamp)
          supply and return ports
          <Cite id="boyd10u" />, so every ferrule, clamp, gasket and valve below is 1.5&quot;. Choose the loop, the run and the
          far end, and the kit prices live when every part is stocked.
        </p>
      }
      citations={CDU_KIT_CITATIONS}
      content={<CduKitContent countryCode={countryCode} />}
    >
      <BuilderShell
        type="cdu-kit"
        initialOptions={options}
        ignored={ignored}
        drawnDate={drawnDate()}
        formTitle="Configure your Boyd 10U kit"
        formFooter={
          <>
            <GlycolNote />
            <WeCanSupply countryCode={countryCode} items={KIT_WE_CAN_SUPPLY} />
          </>
        }
      />
    </BuilderPage>
  )
}
