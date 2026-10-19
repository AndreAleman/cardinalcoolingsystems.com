import { describe, expect, it } from "vitest"
import { CDU_MODELS, CDU_PORTS } from "@lib/cpq/shared"
import { ACCOUNT_PAGES, accountPage, kitLinkFor } from "../account-pages"

const SPEC_COMPANIES = [
  "Nortek DCC", "Boyd", "Vertiv", "AAON / BASX", "Motivair", "Munters", "STULZ", "Chilldyne / Daikin", "nVent",
  "Accelevation", "Advanced Thermal Solutions", "Arizon / DataCool", "AIRSYS", "Baltimore Aircoil", "EVAPCO",
  "McKinstry", "Hermanson", "Southland", "TAS Energy", "Harder", "Ecolab",
]

describe("account pages data (B15)", () => {
  it("holds the spec's 21 companies with unique URL-safe slugs", () => {
    expect(ACCOUNT_PAGES.map((p) => p.company)).toEqual(SPEC_COMPANIES)
    const slugs = ACCOUNT_PAGES.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(21)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it("trigger and connection stay null unless verified; only Boyd has a connection", () => {
    for (const p of ACCOUNT_PAGES) {
      if (p.trigger) {
        expect(p.trigger.text.length).toBeGreaterThan(0)
        expect(p.trigger.source.url).toMatch(/^https:\/\//)
      }
      if (p.slug !== "boyd") expect(p.connection).toBeNull()
    }
  })

  it("Boyd: 1.5\" tri-clamp from its datasheet, the Boyd 10U model's own port", () => {
    const boyd = accountPage("boyd")!
    expect(boyd.connection).toMatchObject({ port: "tc150", cdu: "boyd-10u" })
    expect(boyd.connection!.source.url).toMatch(/boydcorp\.com.*10U/i)
    expect(CDU_PORTS).toContain(boyd.connection!.port)
    expect(CDU_MODELS.find((m) => m.key === boyd.connection!.cdu)!.port).toBe(boyd.connection!.port)
    expect(kitLinkFor(boyd.connection!)).toBe("/build/cdu-kit?cdu=boyd-10u&port=tc150")
  })

  it("lookup is case-insensitive and null for unknown slugs", () => {
    expect(accountPage("BOYD")?.company).toBe("Boyd")
    expect(accountPage("nope")).toBeNull()
  })
})
