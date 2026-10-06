import { feedImageLink, feedShippingWeight, feedSkipReason } from "../product-feed-rules"

const product = {
  thumbnail: "https://cdn.example/p.jpg",
  images: [{ url: "https://cdn.example/p.jpg" }],
  metadata: {},
  weight: null,
}
const variant = { thumbnail: null, weight: 1.5, metadata: {} }

describe("feedSkipReason", () => {
  it("keeps a priced variant with an image and a weight", () => {
    expect(feedSkipReason({ product, variant, calculatedAmount: 12.5 })).toBeNull()
  })

  it("drops quote-only products and variants", () => {
    expect(
      feedSkipReason({ product: { ...product, metadata: { requires_quote: "true" } }, variant, calculatedAmount: 10 })
    ).toBe("quote_only")
    expect(
      feedSkipReason({ product, variant: { ...variant, metadata: { requires_quote: true } }, calculatedAmount: 10 })
    ).toBe("quote_only")
  })

  it("drops variants with no price or a $0 price (quote-only tube and pipe)", () => {
    expect(feedSkipReason({ product, variant, calculatedAmount: undefined })).toBe("no_price")
    expect(feedSkipReason({ product, variant, calculatedAmount: null })).toBe("no_price")
    expect(feedSkipReason({ product, variant, calculatedAmount: 0 })).toBe("zero_price")
    expect(feedSkipReason({ product, variant, calculatedAmount: "0" })).toBe("zero_price")
  })

  it("drops variants with no image anywhere", () => {
    expect(
      feedSkipReason({ product: { ...product, thumbnail: null, images: [] }, variant, calculatedAmount: 10 })
    ).toBe("no_image")
  })

  it("drops variants with no weight on the variant or the product", () => {
    expect(feedSkipReason({ product, variant: { ...variant, weight: null }, calculatedAmount: 10 })).toBe("no_weight")
    expect(feedSkipReason({ product, variant: { ...variant, weight: 0 }, calculatedAmount: 10 })).toBe("no_weight")
    expect(
      feedSkipReason({ product: { ...product, weight: 4 }, variant: { ...variant, weight: null }, calculatedAmount: 10 })
    ).toBeNull()
  })
})

describe("feedImageLink", () => {
  it("prefers the variant thumbnail, then product thumbnail, then first product image", () => {
    expect(feedImageLink({ thumbnail: "v.jpg" }, product)).toBe("v.jpg")
    expect(feedImageLink({}, product)).toBe("https://cdn.example/p.jpg")
    expect(feedImageLink({}, { thumbnail: null, images: [{ url: "i.jpg" }] })).toBe("i.jpg")
    expect(feedImageLink({}, { thumbnail: null, images: [] })).toBeNull()
  })
})

describe("feedShippingWeight", () => {
  it("uses the variant weight, falling back to the product weight", () => {
    expect(feedShippingWeight({ weight: 2 }, { weight: 9 })).toBe(2)
    expect(feedShippingWeight({ weight: null }, { weight: "3.25" })).toBe(3.25)
    expect(feedShippingWeight({ weight: null }, { weight: null })).toBeNull()
  })
})
