import { describe, expect, it } from "vitest"
import { builderLineView, cartHasBuilderLine, cartHasBuilderQuoteLine, guestQuoteSource, isBuilderLine } from "../quote-line"

const quoteLine = {
  product_title: "CDU hookup kit",
  unit_price: 0,
  metadata: {
    builder: true,
    builder_type: "cdu-kit",
    part_number: "kit-cdu-1a2b3c4d",
    pricing_mode: "quote",
    configuration_display: [
      { label: "CDU port", value: '1-1/2" tri-clamp' },
      { label: "CDUs", value: "4" },
    ],
    lead_time: { kind: "custom", label: "Custom production, 3–6 weeks" },
  },
}
const catalogLine = { product_title: "Clamp", unit_price: 6.79, metadata: {} }

describe("builder lines", () => {
  it("detects metadata.builder === true only", () => {
    expect(isBuilderLine(quoteLine)).toBe(true)
    expect(isBuilderLine({ metadata: { builder: "true" } })).toBe(true)
    expect(isBuilderLine({ metadata: { builder: false } })).toBe(false)
    expect(isBuilderLine(catalogLine)).toBe(false)
    expect(isBuilderLine(null)).toBe(false)
  })

  it("guest quote source: builder when any line is a builder line, else cart", () => {
    expect(guestQuoteSource([catalogLine, quoteLine])).toBe("builder")
    expect(guestQuoteSource([catalogLine])).toBe("cart")
    expect(guestQuoteSource([])).toBe("cart")
    expect(guestQuoteSource(null)).toBe("cart")
    expect(cartHasBuilderLine([quoteLine])).toBe(true)
  })

  it("a builder Quote line blocks checkout; an Instant builder line doesn't", () => {
    expect(cartHasBuilderQuoteLine([quoteLine])).toBe(true)
    expect(cartHasBuilderQuoteLine([{ metadata: { builder: true, pricing_mode: "instant" } }])).toBe(false)
  })

  it("view: Part Number, configuration rows, Quote badge, lead time", () => {
    const v = builderLineView(quoteLine)!
    expect(v.partNumber).toBe("kit-cdu-1a2b3c4d")
    expect(v.quote).toBe(true)
    expect(v.display).toHaveLength(2)
    expect(v.leadTime).toBe("Custom production, 3–6 weeks")
    expect(builderLineView(catalogLine)).toBeNull()
  })

  it("view tolerates an object or string configuration_display", () => {
    expect(builderLineView({ metadata: { builder: true, configuration_display: { Size: '2"' } } })!.display).toEqual([{ label: "Size", value: '2"' }])
    expect(builderLineView({ metadata: { builder: true, configuration_display: "2in" } })!.display).toEqual([{ label: "Configuration", value: "2in" }])
  })
})
