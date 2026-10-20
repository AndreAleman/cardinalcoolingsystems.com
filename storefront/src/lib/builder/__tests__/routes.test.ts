import { describe, expect, it } from "vitest"
import { isBuilderSectionPath } from "../routes"

describe("isBuilderSectionPath", () => {
  it("matches the builder section", () => {
    for (const p of ["/us/build", "/us/build/", "/us/build/cdu-kit", "/us/build/cdu-kit/boyd-10u", "/us/for/boyd", "/us/sanitary-vs-bpe"]) {
      expect(isBuilderSectionPath(p)).toBe(true)
    }
  })
  it("leaves the rest of the site alone", () => {
    for (const p of ["/us", "/us/", "/us/contact", "/us/builder", "/us/format", "/us/products/build-kit", "/us/sanitary-vs-bpex", null, undefined, ""]) {
      expect(isBuilderSectionPath(p as string)).toBe(false)
    }
  })
})
