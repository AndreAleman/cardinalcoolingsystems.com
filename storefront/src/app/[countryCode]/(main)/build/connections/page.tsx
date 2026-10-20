import { CONNECTION_DRAWINGS, LoopDiagram, type ConnectionKey } from "@modules/builder/components/connection-drawings"
import { makeCite } from "@modules/builder/components/footnotes"
import BuilderPage, { ContentSection } from "@modules/builder/templates/builder-page"
import { builderMetadata } from "@lib/builder/seo"
import { Metadata } from "next"
import Link from "next/link"

/*
  Connection explainer (spec Page 3 "short explainer the whole site needs once"): tri-clamp,
  I-line, bevel seat, grooved, flanged and NPT, a drawing of each, and which side of a
  liquid-cooling loop each sits on. Primary query: "tri clamp vs I-line".
*/

type Props = { params: { countryCode: string } }

const CITATIONS = ["boyd10u", "ocpManifold", "vertivCdu600Spec", "titan"] as const

export function generateMetadata({ params }: Props): Metadata {
  return builderMetadata({
    countryCode: params.countryCode,
    title: "Tri-Clamp vs I-Line vs Grooved vs Flanged: Liquid Cooling Connections",
    description:
      "Tri-clamp, I-line, bevel seat, grooved, flanged and NPT connections, with a drawing of each and which side of a data center liquid cooling loop each one sits on.",
    path: "/build/connections",
  })
}

type Row = { key: ConnectionKey; name: string; side: string; what: React.ReactNode; where: React.ReactNode }

export default function ConnectionsPage({ params }: Props) {
  const { countryCode } = params
  const Cite = makeCite(CITATIONS)
  const rows: Row[] = [
    {
      key: "tc",
      name: "Tri-clamp",
      side: "CDU and TCS (sanitary side)",
      what: "Two flared ferrules welded to the tube, a gasket between them and a hinged clamp around the outside, closed with a wing nut. No tools, and it opens for cleaning or service in seconds.",
      where: (
        <>
          The standard on CDU ports and the TCS loop: Boyd&apos;s 10U CDU lists 1.5-inch tri-clamp ports
          <Cite id="boyd10u" />, and the OCP guideline names 1-inch sanitary fittings as typical manifold fill points
          <Cite id="ocpManifold" />.
        </>
      ),
    },
    {
      key: "iline",
      name: "I-line",
      side: "Sanitary side, on equipment that uses it",
      what: "A male and a female ferrule that nest into each other, so the gasket is captured and can't blow out; clamped like tri-clamp.",
      where: "Common on food and dairy process lines and less so on data center equipment. Match it when a CDU or skid arrives with I-line ends.",
    },
    {
      key: "bevel",
      name: "Bevel seat",
      side: "Sanitary side, older process equipment",
      what: "A threaded ferrule and a bevel-seat ferrule drawn together by a hex nut; it seals on the bevel when the nut is tightened.",
      where: "Found on older process equipment. If you are tying into it, the transition builder has bevel-seat ends.",
    },
    {
      key: "grv",
      name: "Grooved",
      side: "Facility water (FWS)",
      what: "Roll-grooved pipe ends joined by a bolted coupling housing over a gasket (AWWA C606).",
      where: "The everyday joint on HVAC chilled and condenser water pipe, so it is where the facility side usually meets the CDU skid.",
    },
    {
      key: "flange",
      name: "Flanged",
      side: "Facility water (FWS), and some CDU hose sets",
      what: "Two flanges bolted face to face over a gasket; ASME B16.5 Class 150 is the common rating on facility water.",
      where: (
        <>
          On the facility side, and at the end of some CDU hose sets: Vertiv&apos;s optional CoolChip CDU 600 hose sets have a
          hygienic flange at the unit and an ANSI 150 lb flange at the facility or TCS end
          <Cite id="vertivCdu600Spec" />.
        </>
      ),
    },
    {
      key: "npt",
      name: "NPT",
      side: "Either side, small ports only",
      what: "Tapered pipe thread (ASME B1.20.1) sealed with tape or compound.",
      where: "Fine for instrument, drain and vent ports. Avoid it on large or frequently opened joints in a clean loop.",
    },
  ]

  return (
    <BuilderPage
      countryCode={countryCode}
      crumbs={[{ label: "Build", href: "/build" }, { label: "Connections" }]}
      eyebrow="Explainer · Liquid cooling connections"
      h1="Tri-clamp, I-line, grooved or flanged: which connection goes where in a liquid cooling loop?"
      answer={
        <p>
          Sanitary connections (tri-clamp, and on some process equipment I-line or bevel seat) sit on the CDU and TCS side of
          the loop, where cleanliness and fast service matter; flanged and grooved connections sit on the facility water side,
          where the pipe is HVAC pipe; NPT stays on small ports; and a transition spool joins the two sides. Engineers from
          HVAC know grooved and flanged, engineers from food know tri-clamp, and few know both, so here they are side by side.
        </p>
      }
      citations={CITATIONS}
      testId="connections-page"
    >
      <figure className="border border-neutral-200 bg-white p-4">
        <LoopDiagram />
        <figcaption className="mt-2 text-xs text-neutral-500">
          The usual split. Downstream of the CDU, a 4&quot; header is the most common row manifold
          <Cite id="titan" />.
        </figcaption>
      </figure>

      <ul className="mt-8 grid grid-cols-1 gap-6 small:grid-cols-2" data-testid="connection-list">
        {rows.map((r) => {
          const Drawing = CONNECTION_DRAWINGS[r.key]
          return (
            <li key={r.key} id={r.key} className="flex scroll-mt-28 flex-col gap-3 border border-neutral-200 bg-white p-5" data-testid={`connection-${r.key}`}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-medium text-neutral-900">{r.name}</h2>
                <span className="bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">{r.side}</span>
              </div>
              <div className="border border-neutral-100">
                <Drawing />
              </div>
              <p className="text-sm text-neutral-700">{r.what}</p>
              <p className="text-sm text-neutral-700">{r.where}</p>
            </li>
          )
        })}
      </ul>

      <div className="mt-10 border border-neutral-200 bg-white p-6">
        <ContentSection title="Joining the two sides">
          <p>
            A{" "}
            <Link href={`/${countryCode}/build/transition`} className="font-medium text-cardinal-red underline">
              transition spool
            </Link>{" "}
            puts a sanitary end on the CDU side and a flange, NPT, grooved or butt-weld pipe end on the facility side, reducing
            when the sizes differ. When a stocked adapter does the same job, the builder offers it at its posted price. For the
            whole CDU hookup,{" "}
            <Link href={`/${countryCode}/build/cdu-kit`} className="font-medium text-cardinal-red underline">
              build the kit
            </Link>
            .
          </p>
        </ContentSection>
      </div>
    </BuilderPage>
  )
}
