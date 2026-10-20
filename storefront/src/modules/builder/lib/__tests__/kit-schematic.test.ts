import { describe, expect, it } from "vitest"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { DEFAULT_CDU_KIT_OPTIONS, type Options } from "@lib/cpq/shared"
import { KitSchematic, kitSchematicCaption } from "../../components/schematic/kit-schematic"

const kit = (over: Record<string, unknown>) => ({ ...DEFAULT_CDU_KIT_OPTIONS, ...over }) as unknown as Options
const render = (o: Options) => renderToStaticMarkup(createElement(KitSchematic, { options: o }))

describe("KitSchematic", () => {
  it("is an accessible image with the caption as its name", () => {
    const html = render(kit({}))
    expect(html).toMatch(/^<svg[^>]*role="img"/)
    expect(html).toContain(`aria-label="${kitSchematicCaption(kit({})).replace(/"/g, "&quot;")}"`)
    expect(html).toContain("<title>")
  })

  it("draws no valve or strainer by default", () => {
    const html = render(kit({ iso: "none", strainer: "none" }))
    expect(html).not.toContain('data-symbol="valve-')
    expect(html).not.toContain('data-symbol="strainer"')
  })

  it("draws the valve and strainer symbols when selected", () => {
    const bv = render(kit({ iso: "bv", strainer: "short" }))
    expect(bv).toContain('data-symbol="valve-bv"')
    expect(bv).toContain('data-symbol="strainer"')
    expect(bv).toContain("ball valve")
    expect(render(kit({ iso: "bfv" }))).toContain('data-symbol="valve-bfv"')
  })

  it("hose is wavy, spool is straight; far end and sizes are labeled", () => {
    const hose = render(kit({ run: "hose", len: 36, far: "fl150", side: "fws" }))
    expect(hose).toContain('data-symbol="hose"')
    expect(hose).toContain('36&quot; hose')
    expect(hose).toContain('data-symbol="far-fl150"')
    expect(hose).toContain("150# flange")
    expect(hose).toContain("1.5&quot; TC")
    const spool = render(kit({ run: "hard", len: 48, far: "npt" }))
    expect(spool).toContain('data-symbol="spool"')
    expect(spool).toContain("48&quot; spool")
    expect(spool).toContain('data-symbol="far-npt"')
  })

  it("caption reads the run in order", () => {
    expect(kitSchematicCaption(kit({ cdu: "boyd-10u", port: "tc150", iso: "bv", strainer: "short", run: "hose", len: 36, far: "fl150", side: "tcs", units: 4 }))).toBe(
      'Per port: Boyd 10U CDU, 1.5" tri-clamp port → ball valve → short strainer (supply side) → 36" braided hose → ANSI 150# flange adapter → TCS loop pipe. Two runs per CDU (supply and return) × 4 CDUs.',
    )
  })
})
