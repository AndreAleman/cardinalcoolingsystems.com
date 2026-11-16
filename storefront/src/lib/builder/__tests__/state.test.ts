import { describe, expect, it } from "vitest"
import { getBuilder, BUILDER_TYPES } from "@lib/cpq/shared"
import {
  applyOptionChange,
  countryPrefixOf,
  ignoredParamsNotice,
  isUrlInSync,
  shareUrlFor,
  syncedUrlFor,
  unitsOf,
} from "../state"
import { decodePageOptions } from "../page"

describe("countryPrefixOf", () => {
  it("reads the two-letter prefix", () => {
    expect(countryPrefixOf("/us/build/cdu-kit")).toBe("/us")
    expect(countryPrefixOf("/US")).toBe("/us")
    expect(countryPrefixOf("/build")).toBe("")
  })
})

describe("share URL", () => {
  it("is the builder's canonical path with the canonical query", () => {
    const b = getBuilder("transition")
    const url = shareUrlFor("https://cardinalcoolingsystems.com/us/build/transition?a=tc#x", "transition", b.defaults)
    expect(url).toBe(`https://cardinalcoolingsystems.com/us/build/transition?${b.encode(b.defaults)}`)
    expect(url).toContain("?v=1&a=tc&b=fl150&od=200&odb=200&len=12&alloy=t316l&qty=1")
  })

  it("shares the Boyd page as /build/cdu-kit with cdu=boyd-10u", () => {
    const { options } = decodePageOptions("cdu-kit", {}, { cdu: "boyd-10u" })
    const url = new URL(shareUrlFor("https://x.test/us/build/cdu-kit/boyd-10u", "cdu-kit", options))
    expect(url.pathname).toBe("/us/build/cdu-kit")
    expect(url.searchParams.get("cdu")).toBe("boyd-10u")
    expect(url.searchParams.get("port")).toBe("tc150")
  })

  it("round-trips: decoding a share link gives the same options for every builder", () => {
    for (const t of BUILDER_TYPES) {
      const b = getBuilder(t as string)
      const url = new URL(shareUrlFor("https://x.test/us/build", t, b.defaults))
      expect(url.pathname).toBe(`/us${b.path}`)
      expect(b.decode(url.searchParams).options).toEqual(b.defaults)
    }
  })

  it("address-bar sync keeps the page path and hash, replaces the query", () => {
    const b = getBuilder("hose")
    const href = "https://x.test/us/build/hose?len=999#cad"
    expect(isUrlInSync(href, "hose", b.defaults)).toBe(false)
    const synced = syncedUrlFor(href, "hose", b.defaults)
    expect(synced).toBe(`https://x.test/us/build/hose?${b.encode(b.defaults)}#cad`)
    expect(isUrlInSync(synced, "hose", b.defaults)).toBe(true)
  })
})

describe("applyOptionChange", () => {
  const kit = getBuilder("cdu-kit").defaults

  it("a CDU model fixes its port; a hand-picked port clears the model", () => {
    const a = applyOptionChange("cdu-kit", { ...kit, port: "tc300" }, "cdu", "boyd-10u")
    expect(a.ok && a.options.port).toBe("tc150")
    if (!a.ok) return
    const b = applyOptionChange("cdu-kit", a.options, "port", "tc200")
    expect(b.ok && b.options).toMatchObject({ cdu: "none", port: "tc200" })
  })

  it("switching the loop moves the far end only while it was on the loop default", () => {
    const fws = applyOptionChange("cdu-kit", kit, "side", "fws")
    expect(fws.ok && fws.options.far).toBe("fl150")
    const custom = applyOptionChange("cdu-kit", { ...kit, far: "npt" }, "side", "fws")
    expect(custom.ok && custom.options.far).toBe("npt")
  })

  it("transition size B follows size A until it is reducing", () => {
    const t = getBuilder("transition").defaults
    const a = applyOptionChange("transition", t, "od", 300)
    expect(a.ok && a.options).toMatchObject({ od: 300, odb: 300 })
    const r = applyOptionChange("transition", { ...t, odb: 100 }, "od", 300)
    expect(r.ok && r.options).toMatchObject({ od: 300, odb: 100 })
  })

  it("rejects out-of-range values with a message", () => {
    const r = applyOptionChange("hose", getBuilder("hose").defaults, "len", 9999)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/len/)
  })
})

describe("page decode and notices", () => {
  it("reports invalid link params and falls back to defaults", () => {
    const { options, ignored } = decodePageOptions("strainer", { size: "999", mesh: "100" })
    expect(options.size).toBe(200)
    expect(options.mesh).toBe("100")
    expect(ignored).toEqual(["size"])
    expect(ignoredParamsNotice(ignored)).toMatch(/size/)
    expect(ignoredParamsNotice([])).toBeNull()
  })

  it("prefill fills keys the link doesn't set; the link wins", () => {
    expect(decodePageOptions("cdu-kit", {}, { cdu: "boyd-10u" }).options.cdu).toBe("boyd-10u")
    expect(decodePageOptions("cdu-kit", { cdu: "none" }, { cdu: "boyd-10u" }).options.cdu).toBe("none")
  })

  it("units: CDUs, a manifold pair counts 2, quantity otherwise", () => {
    expect(unitsOf("cdu-kit", { ...getBuilder("cdu-kit").defaults, units: 4 })).toBe(4)
    expect(unitsOf("row-manifold", getBuilder("row-manifold").defaults)).toBe(2)
    expect(unitsOf("hose", { ...getBuilder("hose").defaults, qty: 3 })).toBe(3)
  })
})
