import { isQuoteOwner } from "../../workflows/quote/utils/quote-ownership"

describe("isQuoteOwner", () => {
  it("accepts the quote's own customer", () => {
    expect(isQuoteOwner({ customer_id: "cus_1" }, "cus_1")).toBe(true)
  })

  it("rejects a different customer", () => {
    expect(isQuoteOwner({ customer_id: "cus_1" }, "cus_2")).toBe(false)
  })

  it("rejects when either side is missing — never fails open", () => {
    expect(isQuoteOwner({ customer_id: null }, "cus_1")).toBe(false)
    expect(isQuoteOwner({ customer_id: undefined }, "cus_1")).toBe(false)
    expect(isQuoteOwner({ customer_id: "cus_1" }, null)).toBe(false)
    expect(isQuoteOwner({ customer_id: "cus_1" }, undefined)).toBe(false)
    expect(isQuoteOwner({ customer_id: "" }, "")).toBe(false)
  })
})
