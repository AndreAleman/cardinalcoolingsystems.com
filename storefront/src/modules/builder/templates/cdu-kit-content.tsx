// CDU Hookup Kit supporting content (spec Page 1): why these sizes (datasheet citations),
// connection sizes by CDU model, the BOM rules and gasket compatibility. Shared by /build/cdu-kit
// and /build/cdu-kit/boyd-10u.

import { makeCite } from "@modules/builder/components/footnotes"
import { LeadTimeFacts } from "@modules/builder/components/page-bits"
import { ContentSection } from "./builder-page"
import Link from "next/link"

export const CDU_KIT_CITATIONS = ["boyd10u", "vertivCdu600", "ocpManifold", "titan"] as const

export default function CduKitContent({ countryCode }: { countryCode: string }) {
  const Cite = makeCite(CDU_KIT_CITATIONS)
  return (
    <>
      <LeadTimeFacts />

      <ContentSection title="Why these sizes" id="why-these-sizes">
        <p>
          Boyd&apos;s 10U CDU lists 1.5-inch sanitary (tri-clamp) ports
          <Cite id="boyd10u" />; Vertiv&apos;s CoolChip CDU 600 connects with stainless hygienic fittings and ships a hose
          set with hygienic flange to ANSI 150
          <Cite id="vertivCdu600" />. The kit starts from that port: every ferrule, clamp, gasket and valve is the port
          size, and the far end adapts to whatever the facility or TCS pipe is.
        </p>
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full min-w-[480px] text-left text-sm" data-testid="cdu-port-table">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">CDU</th>
                <th scope="col" className="px-4 py-2 font-medium">Supply / return connection</th>
                <th scope="col" className="px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium text-neutral-900">
                  <Link href={`/${countryCode}/build/cdu-kit/boyd-10u`} className="underline">
                    Boyd 10U
                  </Link>
                </td>
                <td className="px-4 py-3">1.5&quot; sanitary tri-clamp</td>
                <td className="px-4 py-3">
                  Datasheet <Cite id="boyd10u" />
                </td>
              </tr>
              <tr className="border-t border-neutral-100">
                <td className="px-4 py-3 font-medium text-neutral-900">Vertiv CoolChip CDU 600</td>
                <td className="px-4 py-3">Stainless hygienic fittings; hose set with hygienic flange to ANSI 150. Port size being confirmed.</td>
                <td className="px-4 py-3">
                  Guide specification <Cite id="vertivCdu600" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-neutral-500">
          We add a CDU here only when its port size is read from the manufacturer&apos;s datasheet. Not listed? Pick the port
          size, or send us the datasheet.
        </p>
      </ContentSection>

      <ContentSection title="What goes in the kit">
        <p>Per CDU, per port, so most lines are ×2:</p>
        <ul className="list-disc pl-5">
          <li>One ferrule per connection, port size; one heavy-duty clamp and one gasket per tri-clamp joint.</li>
          <li>An isolation valve adds two joints (two clamps, two gaskets); the supply-side strainer adds two more.</li>
          <li>A far end that isn&apos;t tri-clamp gets a transition adapter: TC × flange, TC × NPT or TC × grooved.</li>
          <li>
            The run is a welded spool (Quote: welded to your length) or a stainless braided hose (Instant at a stocked
            standard length).
          </li>
          <li>Spares, if you want them: +10% gaskets and one spare clamp per kit.</li>
        </ul>
        <p>
          Kits made only of stocked parts show a live price and ship in 1–2 business days. Anything welded or cut to length
          shows the lead time and a firm quote within 1 business day, never a made-up number.
        </p>
      </ContentSection>

      <ContentSection title="Gaskets for PG25 glycol loops">
        <p>
          The kit defaults to EPDM peroxide-cured gaskets, the choice that matches the OCP loop-back guidance
          <Cite id="ocpManifold" /> and suits water and PG25 propylene glycol. Silicone and PTFE are options.
        </p>
      </ContentSection>

      <ContentSection title="Building the rest of the loop">
        <p>
          Downstream of the kit, the TCS loop feeds a row manifold; 4&quot; is the most common header
          <Cite id="titan" />.{" "}
          <Link href={`/${countryCode}/build/row-manifold`} className="font-medium text-cardinal-red underline">
            Build a row manifold
          </Link>
          , or{" "}
          <Link href={`/${countryCode}/build/connections`} className="font-medium text-cardinal-red underline">
            see which connection goes where
          </Link>
          .
        </p>
      </ContentSection>
    </>
  )
}
