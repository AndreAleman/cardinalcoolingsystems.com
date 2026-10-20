// The shared Engineering View sheets rendered under React 18 (the backend renders them to the SVG the
// cad-service turns into the PDF), against committed goldens:
// - fixtures/<name>-sheet-golden.svg: BuilderSheet for each builder's golden vector;
// - fixtures/transition-golden.json, manifold-golden.json: geometry vectors (input options, Part
//   Number, the `expected` block cad-service checks, weight) for the CAD stream's Python tests.
// After a deliberate change: CPQ_UPDATE_FIXTURES=1 pnpm test:unit, then
// node scripts/sync-cpq-shared.mjs (copies the goldens to cad-service), and bump DRAWING_VERSION
// for a visible drawing change.
import fs from "node:fs"
import path from "node:path"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { getBuilder, type BuilderType, type Options } from "../cpq-shared"
import { BuilderSheet, COMPANY, DRAWING_VERSION } from "../cpq-shared/drawing"

const FIXTURES = path.resolve(__dirname, "../../../../shared/cpq/fixtures")
const DRAWN = "10/18/2026"
const LOGO = "cardinal-logo.svg"
const UPDATE = process.env.CPQ_UPDATE_FIXTURES === "1"

function render(type: BuilderType, query: string, extra: Record<string, unknown> = {}) {
  const b = getBuilder(type as string)
  const { options, ignored } = b.decode(new URLSearchParams(query))
  expect(ignored).toEqual([])
  const svg = renderToStaticMarkup(
    createElement(BuilderSheet, { builderType: type, options, drawnDate: DRAWN, logoHref: LOGO, print: true, ...extra })
  )
  return { svg, options, pn: b.partNumber(options) }
}

function expectGolden(file: string, content: string) {
  const fixture = path.join(FIXTURES, file)
  if (UPDATE) fs.writeFileSync(fixture, content)
  expect(fs.readFileSync(fixture, "utf8")).toBe(content)
}

function expectSheet(svg: string, pn: string, part: string) {
  expect(svg.startsWith('<svg viewBox="0 0 1000 640" width="17in" height="11in"')).toBe(true)
  expect(svg).toContain(`href="${LOGO}"`)
  expect(svg).toContain(`data-part="${part}"`)
  expect(svg.split(`>${pn}</text>`).length).toBe(3) // PART# and DWG NO
  expect(svg).toContain(`>${COMPANY}</text>`)
  expect(svg).toContain(">CERTIFIED DRAWING ON QUOTE APPROVAL</text>")
  // CairoSVG-safe: no masks, clip paths, filters, patterns or foreign objects in the sheet itself.
  expect(svg).not.toMatch(/<(mask|clipPath|filter|pattern|foreignObject)\b/)
}

const SHEETS: { name: string; type: BuilderType; query: string; part: string; texts: string[]; review?: boolean }[] = [
  { name: "transition", type: "transition", query: "", part: "transition", texts: ["12", ".5", "2.5", "Ø2 TUBE", ".065 WALL", "A (TC)", "B (150# FLG)", "FLANGE BOLT HOLES NOT SHOWN"] },
  { name: "transition-reducing", type: "transition", query: "a=tc&b=fl150&od=200&odb=150&len=12", part: "transition", texts: ["12", "3", "2.44", "Ø2", "Ø1.5 TUBE", "CONCENTRIC REDUCER PER ASME B16.9 (APPROX.)"] },
  { name: "manifold", type: "row-manifold", query: "", part: "row-manifold", texts: ["280", "24", "7", "Ø4", "A (TC)", "B (TC)", "FILL 1&quot;", "9 DROPS NOT SHOWN (BROKEN VIEW)"], review: true },
  { name: "manifold-valves", type: "row-manifold", query: "drops=4&dstyle=bv&ends=cap&inst=1&pitch=18", part: "row-manifold", texts: ["70", "18", "A (TC)", "B (CAP)", "2× T/P 1/2&quot;"] },
  { name: "strainer", type: "strainer", query: "", part: "strainer", texts: ["10.5", "8", "Ø2", "A (TC)", "B (TC)"] },
  { name: "hose", type: "hose", query: "", part: "hose", texts: ["36", "Ø1.5", "A (TC)", "B (TC)"] },
  { name: "kit", type: "cdu-kit", query: "cdu=boyd-10u&run=hard&iso=bfv&strainer=short", part: "cdu-kit", texts: ["BILL OF MATERIALS", "clmp-clmp-spool-l36-6-150", "TCBFN6-150", "10"] },
]

describe("cpq-shared drawing goldens (React 18)", () => {
  it("DRAWING_VERSION is 2 (2026-10-20: manifold d100-clmp, clamp alloy on the kit BOM, weight to 0.1 lb)", () => {
    expect(DRAWING_VERSION).toBe(2)
  })

  for (const s of SHEETS) {
    it(`${s.name}: ${s.type}?${s.query || "(defaults)"} = ${s.name}-sheet-golden.svg`, () => {
      const { svg, pn } = render(s.type, s.query)
      expectSheet(svg, pn, s.part)
      for (const t of s.texts) expect(svg).toContain(`>${t}</text>`)
      if (s.review) expect(svg).toContain('data-stamp="engineering-review"')
      else expect(svg).not.toContain("engineering-review")
      expectGolden(`${s.name}-sheet-golden.svg`, svg + "\n")
    })
  }

  it("Instant mode drops the certified-drawing note; a resolved SKU list shows on the kit sheet", () => {
    const { svg } = render("cdu-kit", "", { pricingMode: "instant", resolvedSkus: [null, "14AM76-150", "13MHHM-100-150", "GTCE-150"] })
    expect(svg).not.toContain("CERTIFIED DRAWING ON QUOTE APPROVAL")
    expect(svg).toContain(">Reference only.</text>")
    expect(svg).toContain(">13MHHM-100-150</text>")
  })
})

// Geometry vectors for the cad-service (the Sanitube `expected` pattern).
const VECTORS: { file: string; type: BuilderType; vectors: [string, string][] }[] = [
  {
    file: "transition-golden.json",
    type: "transition",
    vectors: [
      ["plan golden: 2in TC x 150# flange 12in T316L", ""],
      ["reducing: 2in TC x 1-1/2in 150# flange 12in", "od=200&odb=150"],
      ["long: 4in bevel seat x grooved 60in", "a=pbs&b=grv&od=400&len=60"],
      ["short: 8in TC x 300# flange 6in", "a=tc&b=fl300&od=800&len=6"],
      ["butt-weld pipe: 3in bw x bwp 24.125in T304L", "a=bw&b=bwp&od=300&len=24.125&alloy=t304l"],
    ],
  },
  {
    file: "manifold-golden.json",
    type: "row-manifold",
    vectors: [
      ["plan golden: 4in header, 12 x 1in TC drops at 24in, TC ends", ""],
      ["ball-valve drops, capped, instrument ports", "drops=4&dstyle=bv&ends=cap&inst=1&pitch=18"],
      ["6in header, 1-1/2in UQD stubs, 150# flanges, no fill", "header=600&drop=150&dstyle=uqd&ends=fl150&fill=0&drops=6&pitch=30"],
    ],
  },
]

describe("cpq-shared geometry goldens", () => {
  for (const v of VECTORS) {
    it(`${v.file} matches the current geometry`, () => {
      const b = getBuilder(v.type as string)
      const doc = {
        version: 1,
        description: `Golden ${v.type} vectors: input options (canonical), Part Number, the expected geometry block cad-service checks (every leaf within tolerance), weight. Written by backend/src/lib/__tests__/cpq-shared-drawing.unit.spec.ts with CPQ_UPDATE_FIXTURES=1.`,
        tolerance: 1e-3,
        vectors: v.vectors.map(([name, q]) => {
          const { options, ignored } = b.decode(new URLSearchParams(q))
          expect(ignored).toEqual([])
          return {
            name,
            input: options as Options,
            share_query: b.encode(options),
            part_number: b.partNumber(options),
            expected: b.expected!(options),
            weight_lb: Math.round(b.weight(options).per_unit_lb * 1e6) / 1e6,
            standard_range: b.standardRange(options).reasons.map((r) => r.code),
          }
        }),
      }
      expectGolden(v.file, JSON.stringify(doc, null, 2) + "\n")
    })
  }
})
