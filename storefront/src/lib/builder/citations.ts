// Datasheet and standard references for the builder pages (spec "Sources"). They are the content,
// not decoration: each page cites them inline as numbered footnotes.

export type Citation = { id: string; title: string; url: string; note?: string }

export const CITATIONS = {
  boyd10u: {
    id: "boyd10u",
    title: "Boyd 10U Cooling Distribution Unit datasheet",
    url: "https://info.boydcorp.com/hubfs/Thermal/Liquid-Cooling/Boyd-10U-Cooling-Distribution-Unit-CDU.pdf",
  },
  vertivCdu600: {
    id: "vertivCdu600",
    title: "Vertiv CoolChip CDU 600 Installation and Commissioning Guide (SL-07625 Rev C), Table 4.2 and §5.4–5.5",
    url: "https://www.vertiv.com/4a689f/globalassets/shared/vertiv-coolchip-cdu-600-installation-and-commissioning-guide-sl-07625.pdf",
    note: '2-1/2" (DN65) sanitary flanges, primary and secondary',
  },
  vertivCdu600Spec: {
    id: "vertivCdu600Spec",
    title: "Vertiv CoolChip CDU 600/1350 Guide Specifications (SL-80239 Rev A), §2.1.2 and §4.2–4.3",
    url: "https://www.vertiv.com/4aa3f7/globalassets/shared/vertiv-coolchip-cdu-600-guide-specifications-sl-80239.pdf",
  },
  ocpManifold: {
    id: "ocpManifold",
    title: "OCP: Guidelines for pre-commission preparation of TCS row manifolds (Jan 2025), §1.4",
    url: "https://www.opencompute.org/documents/ocp-document-submission-guidelines-for-pre-commission-preparation-of-technology-cooling-system-tcs-row-manifolds-revq-pdf-1",
  },
  ocpPg25: {
    id: "ocpPg25",
    title: "OCP: Guidelines for using propylene glycol-based heat transfer fluids in liquid cooled racks (Rev 2.0, 2026), Tables 3–4",
    url: "https://www.opencompute.org/wp-content/uploads/2026/10/OCP-PG25-Guidelines-V1.0.0.pdf",
  },
  ocpWater: {
    id: "ocpWater",
    title: "OCP: Guidelines for using water-based transfer fluids in single-phase cold plate-based liquid cooled racks (2022), Tables 1–2",
    url: "https://www.opencompute.org/documents/guidelines-for-using-water-based-transfer-fluids-in-single-phase-cold-plate-based-liquid-cooled-racks-final-pdf/",
  },
  titan: {
    id: "titan",
    title: "Titan Fittings: What fittings a data center liquid cooling system needs",
    url: "https://www.titanfittings.com/articles/data-center-liquid-cooling-fittings",
  },
  dixon: {
    id: "dixon",
    title: "Dixon Data Cooling Solutions catalog",
    url: "https://canada.dixonvalve.com/sites/default/files/documents/data_cooling_solutions.pdf",
  },
} as const satisfies Record<string, Citation>

export type CitationId = keyof typeof CITATIONS

/** Footnote numbers in first-use order for a page's citation list. */
export function footnoteNumbers(ids: readonly CitationId[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const id of ids) if (!(id in out)) out[id] = Object.keys(out).length + 1
  return out
}
