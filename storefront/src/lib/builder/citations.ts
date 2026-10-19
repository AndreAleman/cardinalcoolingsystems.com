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
    title: "Vertiv CoolChip CDU 600 guide specifications",
    url: "https://www.vertiv.com/4aa3f7/globalassets/shared/vertiv-coolchip-cdu-600-guide-specifications-sl-80239.pdf",
  },
  ocpManifold: {
    id: "ocpManifold",
    title: "OCP: Guidelines for pre-commission preparation of TCS row manifolds",
    url: "https://www.opencompute.org/documents/ocp-document-submission-guidelines-for-pre-commission-preparation-of-technology-cooling-system-tcs-row-manifolds-revq-pdf-1",
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
