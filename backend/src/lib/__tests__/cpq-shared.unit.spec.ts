// The generated shared CPQ core (shared/cpq → src/lib/cpq-shared) under the backend's Node16/CJS/SWC
// setup: Share Links, Part Numbers, BOM rules, weights and geometry, the tables, and the sync guard.
import { execFileSync } from "node:child_process"
import crypto from "node:crypto"
import fs from "node:fs"
import path from "node:path"
import {
  BUILDERS,
  BUILDER_TYPES,
  CDU_MODELS,
  CPQ_TABLES_HASH,
  DEFAULT_CDU_KIT_OPTIONS,
  END_CONNECTION_ROWS,
  KIT_RULES,
  formatLb,
  roundLb,
  totalLb,
  buildBom,
  candidatesFor,
  canonicalBomText,
  endConnectionRow,
  getBuilder,
  isBuilderType,
  kitPartNumber,
  manifoldGeometry,
  manifoldHeaderLength,
  parsePartNumber,
  resultSummary,
  sha256Hex,
  spoolPartNumber,
  transitionGeometry,
  tubeDims,
  type Bom,
  type BomLine,
  type CduKitOptions,
  type HoseOptions,
  type Options,
  type RowManifoldOptions,
  type StrainerOptions,
  type TransitionOptions,
} from "../cpq-shared"

const ROOT = path.resolve(__dirname, "../../../..")
const SEED = JSON.parse(
  fs.readFileSync(path.join(ROOT, "backend/src/scripts/data/builder-seed-catalog.json"), "utf8")
) as { variants: { sku: string; price: number | null; weight: number | null; inventory_quantity: number | null; manage_inventory: boolean | null }[] }

const kit = BUILDERS["cdu-kit"]
const manifold = BUILDERS["row-manifold"]
const transition = BUILDERS.transition
const strainer = BUILDERS.strainer
const hose = BUILDERS.hose

/** B1 against the seed catalog: the first candidate that is priced, weighed and in stock. */
function resolveLine(l: BomLine, units = 1): string | null {
  if (l.kind === "fabricated") return null
  for (const sku of l.candidates) {
    const v = SEED.variants.find((x) => x.sku === sku)
    if (!v) continue
    const stockOk = v.manage_inventory === false || (v.inventory_quantity ?? 0) >= l.qty_per_unit * units
    if ((v.price ?? 0) > 0 && (v.weight ?? 0) > 0 && stockOk) return sku
  }
  return null
}

function line(bom: Bom, role: string): BomLine {
  const l = bom.lines.find((x) => x.role === role)
  if (!l) throw new Error(`no ${role} line in ${bom.lines.map((x) => x.role).join(", ")}`)
  return l
}

// ---------------------------------------------------------------- registry

describe("builder registry", () => {
  it("registers the five builders, each with the full contract", () => {
    expect(BUILDER_TYPES).toEqual(["cdu-kit", "row-manifold", "transition", "strainer", "hose"])
    for (const t of BUILDER_TYPES) {
      const b = getBuilder(t as string)
      expect(b.type).toBe(t)
      expect(b.path).toBe(`/build/${t}`)
      for (const fn of ["decode", "encode", "validate", "configKey", "partNumber", "describe", "weight", "bom", "standardRange", "specBlock", "leadTime"] as const) {
        expect(typeof b[fn]).toBe("function")
      }
      expect(b.validate(b.defaults).ok).toBe(true)
    }
    expect(isBuilderType("spool")).toBe(false)
    expect(() => getBuilder("spool")).toThrow("Unknown builder type")
  })

  it("STEP only for the transition and the manifold (B8); geometry for every part but the kit", () => {
    expect(BUILDER_TYPES.filter((t) => getBuilder(t as string).hasStep)).toEqual(["row-manifold", "transition"])
    expect(BUILDER_TYPES.filter((t) => getBuilder(t as string).geometry)).toEqual(["row-manifold", "transition", "strainer", "hose"])
  })
})

// ---------------------------------------------------------------- share links

describe("share links", () => {
  it("defaults follow the plan's URL table", () => {
    expect(kit.encode(kit.defaults)).toBe(
      "v=1&cdu=none&port=tc150&side=tcs&run=hose&far=tc&len=36&iso=none&strainer=none&gasket=epdm&spares=0&units=1&alloy=t316l"
    )
    expect(manifold.encode(manifold.defaults)).toBe(
      "v=1&header=400&drops=12&pitch=24&drop=100&dstyle=tc&ends=tc&pair=1&alloy=t316l&finish=32&fill=1&inst=0&docs=hydro,mtr"
    )
    expect(transition.encode(transition.defaults)).toBe("v=1&a=tc&b=fl150&od=200&odb=200&len=12&alloy=t316l&qty=1")
    expect(strainer.encode(strainer.defaults)).toBe("v=1&size=200&body=short&mesh=20&iso=0&dp=0&qty=1")
    expect(hose.encode(hose.defaults)).toBe("v=1&size=150&len=36&ends=tc-tc&cover=braid&sleeve=none&qty=1")
    expect(transition.configKey(transition.defaults)).toBe("transition?v=1&a=tc&b=fl150&od=200&odb=200&len=12&alloy=t316l&qty=1")
    expect(hose.sharePath(hose.defaults)).toBe("/build/hose?v=1&size=150&len=36&ends=tc-tc&cover=braid&sleeve=none&qty=1")
  })

  it("the spec's example URLs decode with nothing ignored", () => {
    const k = kit.decode(new URLSearchParams("port=tc150&side=tcs&run=hard&len=36&units=4"))
    expect(k.ignored).toEqual([])
    expect(k.options).toMatchObject({ port: "tc150", side: "tcs", run: "hard", len: 36, units: 4, far: "tc" })
    const m = manifold.decode(new URLSearchParams("header=400&drops=12&drop=100&pitch=24&ends=tc&alloy=t316l"))
    expect(m.ignored).toEqual([])
    const t = transition.decode(new URLSearchParams("a=tc&b=fl150&od=200&len=12&alloy=t316l"))
    expect(t.ignored).toEqual([])
    expect(t.options.odb).toBe(200)
  })

  it("round-trips: decode(encode(o)) = o, and the canonical query is the identity", () => {
    const samples: [string, Options][] = []
    for (const o of manifoldSamples()) samples.push(["row-manifold", o])
    for (const o of transitionSamples()) samples.push(["transition", o])
    for (const o of strainerSamples()) samples.push(["strainer", o])
    for (const o of hoseSamples()) samples.push(["hose", o])
    for (const o of kitSamples()) samples.push(["cdu-kit", o])
    expect(samples.length).toBeGreaterThan(1500)
    for (const [t, o] of samples) {
      const b = getBuilder(t)
      const q = b.encode(o)
      const d = b.decode(new URLSearchParams(q))
      expect(d.ignored).toEqual([])
      expect(d.options).toEqual(o)
      expect(b.encode(d.options)).toBe(q)
      expect(b.validate(o).ok).toBe(true)
    }
  })

  it("decodes forgivingly: invalid → default + ignored (key order), missing → default, unknown keys silent", () => {
    const d = transition.decode(new URLSearchParams("v=2&a=zz&b=grv&od=999&len=1.3&alloy=T304L&qty=0&utm_source=x"))
    expect(d.ignored).toEqual(["v", "a", "od", "len", "qty"])
    expect(d.options).toEqual({ ...transition.defaults, b: "grv", alloy: "t304l" })
    expect(transition.decode(null).options).toEqual(transition.defaults)
    expect(transition.decode({}).ignored).toEqual([])
  })

  it("odb defaults to od; a valid odb makes a reducing transition", () => {
    expect(transition.decode({ od: "400" }).options).toMatchObject({ od: 400, odb: 400 })
    expect(transition.decode({ od: "400", odb: "300" }).options).toMatchObject({ od: 400, odb: 300 })
    expect(transition.decode({ od: "400", odb: "350" })).toMatchObject({ options: { odb: 400 }, ignored: ["odb"] })
  })

  it("CDU kit defaults (David, 2026-10-20): TCS, hose 36\", no valves or strainer, EPDM, 316L, no spares, 1 CDU", () => {
    expect(kit.defaults).toEqual({
      cdu: "none",
      port: "tc150",
      side: "tcs",
      run: "hose",
      far: "tc",
      len: 36,
      iso: "none",
      strainer: "none",
      gasket: "epdm",
      spares: "0",
      units: 1,
      alloy: "t316l",
    })
    expect(DEFAULT_CDU_KIT_OPTIONS).toEqual(kit.defaults)
  })

  it("CDU kit: a link with v but no run predates the hose default and still means hard pipe", () => {
    // Every Share Link carries every key, so an old full link keeps its meaning by construction.
    const oldFull = "v=1&cdu=none&port=tc150&side=tcs&run=hard&far=tc&len=36&iso=none&strainer=none&gasket=epdm&spares=0&units=1&alloy=t316l"
    expect(kit.decode(new URLSearchParams(oldFull))).toEqual({ options: { ...kit.defaults, run: "hard" }, ignored: [] })
    // A partial link written against v=1 (or an unknown v, read as 1) without run: hard, as it meant then.
    expect(kit.decode(new URLSearchParams("v=1&port=tc200&units=4")).options.run).toBe("hard")
    expect(kit.decode(new URLSearchParams("v=7&port=tc200")).options.run).toBe("hard")
    // Explicit run always wins; an invalid run falls back to the current default and is reported.
    expect(kit.decode(new URLSearchParams("v=1&run=hose")).options.run).toBe("hose")
    expect(kit.decode(new URLSearchParams("v=1&run=hard")).options.run).toBe("hard")
    expect(kit.decode(new URLSearchParams("v=1&run=pipe"))).toMatchObject({ options: { run: "hose" }, ignored: ["run"] })
    // No v (a bare page, a hand-written prefill such as /build/cdu-kit?cdu=boyd-10u&port=tc150, a JSON body): today's default.
    expect(kit.decode(new URLSearchParams("cdu=boyd-10u&port=tc150")).options.run).toBe("hose")
    expect(kit.decode({}).options.run).toBe("hose")
    expect(kit.decode({ port: "tc200" }).options.run).toBe("hose")
    // The canonical link of a hose kit says so, so it never depends on the default.
    expect(kit.encode(kit.defaults)).toContain("&run=hose&")
    // Other builders ignore the version rule.
    expect(transition.decode(new URLSearchParams("v=1")).options).toEqual(transition.defaults)
  })

  it("CDU kit: a known CDU fixes its port (B13); the far end defaults by loop", () => {
    expect(kit.decode({ cdu: "boyd-10u" })).toEqual({ options: { ...kit.defaults, cdu: "boyd-10u", port: "tc150" }, ignored: [] })
    expect(kit.decode({ cdu: "boyd-10u", port: "tc300" }).ignored).toEqual(["port"])
    expect(kit.decode({ cdu: "boyd-10u", port: "tc300" }).options.port).toBe("tc150")
    expect(kit.decode({ side: "fws" }).options.far).toBe("fl150")
    expect(kit.decode({ side: "fws", far: "grv" }).options.far).toBe("grv")
    expect(kit.decode({ side: "fws", far: "nope" })).toMatchObject({ options: { far: "fl150" }, ignored: ["far"] })
    expect(kit.validate({ ...kit.defaults, cdu: "boyd-10u", port: "tc300" }).ok).toBe(false)
  })

  it("accepts a JSON body (numbers, arrays) as well as a query", () => {
    const m = manifold.decode({ header: 600, drops: 4, docs: ["weldmap", "hydro", "hydro"] })
    expect(m.ignored).toEqual([])
    expect(m.options).toMatchObject({ header: 600, drops: 4, docs: ["hydro", "weldmap"] })
    expect(manifold.encode(m.options)).toContain("docs=hydro,weldmap")
    expect(manifold.decode({ docs: "" }).options.docs).toEqual([])
    expect(manifold.decode({ docs: "hydro,xray" })).toMatchObject({ options: { docs: ["hydro", "mtr"] }, ignored: ["docs"] })
    expect(hose.decode({ size: "50" }).options.size).toBe(50)
    expect(hose.decode({ size: "050" }).options.size).toBe(50)
  })

  it("hose: NPT / flange ends start at 1\", a smaller size resets them", () => {
    expect(hose.decode({ size: "050", ends: "tc-npt" })).toMatchObject({ options: { size: 50, ends: "tc-tc" }, ignored: ["ends"] })
    expect(hose.validate({ ...hose.defaults, size: 50, ends: "tc-fl150" }).ok).toBe(false)
  })

  it("validate is strict", () => {
    const r = transition.validate({ ...transition.defaults, len: 12.1, od: 201 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.map((e) => e.key)).toEqual(["od", "len"])
    expect(transition.validate(null).ok).toBe(false)
    // Lists are canonicalized, not rejected, when every item is valid.
    expect(manifold.validate({ ...manifold.defaults, docs: ["mtr", "hydro"] })).toEqual({ ok: true, value: manifold.defaults })
    expect(manifold.validate({ ...manifold.defaults, docs: ["mtr", "mtr"] }).ok).toBe(false)
  })
})

// ---------------------------------------------------------------- part numbers

describe("part numbers", () => {
  it("follow B11 for every builder", () => {
    expect(transition.partNumber(transition.defaults)).toBe("clmp-fl150-tspool-l12-6-200")
    expect(transition.partNumber({ ...transition.defaults, odb: 150 })).toBe("clmp-fl150-tspool-l12-6-200-150")
    expect(transition.partNumber({ ...transition.defaults, a: "bw", b: "bwp", len: 36.125, alloy: "t304l", od: 800, odb: 800 })).toBe(
      "bw-bwp-tspool-l36p125-4-800"
    )
    expect(manifold.partNumber(manifold.defaults)).toBe("clmp-clmp-rman-n12-d100-clmp-p24-6-400")
    expect(manifold.partNumber({ ...manifold.defaults, ends: "cap", dstyle: "uqd", finish: "20", fill: "0", inst: "1" })).toBe(
      "clmp-cap-rman-n12-d100-uqd-p24-6-400-ra20-nf-ip"
    )
    expect(strainer.partNumber({ ...strainer.defaults, iso: "1", dp: "1", mesh: "100" })).toBe("clmp-clmp-strn-short-m100-6-200-iso-dp")
    expect(hose.partNumber({ ...hose.defaults, ends: "tc-npt", cover: "ptfe", sleeve: "fire", size: 50 })).toBe(
      "clmp-mnpt-hose-l36-ptfe-6-050-fire"
    )
    expect(spoolPartNumber("tc", "tc", 36, "t316l", 150)).toBe("clmp-clmp-spool-l36-6-150")
    expect(kit.partNumber(kit.defaults)).toMatch(/^kit-cdu-[0-9a-f]{8}$/)
  })

  it("round-trip build → parse → build for every type", () => {
    let n = 0
    const check = (t: "row-manifold" | "transition" | "strainer" | "hose", o: Options) => {
      const b = getBuilder(t)
      const pn = b.partNumber(o)
      const parsed = parsePartNumber(pn)
      expect(parsed?.builder_type).toBe(t)
      expect(b.partNumber(parsed!.options as Options)).toBe(pn)
      n++
    }
    for (const o of manifoldSamples()) check("row-manifold", o)
    for (const o of transitionSamples()) check("transition", o)
    for (const o of strainerSamples()) check("strainer", o)
    for (const o of hoseSamples()) check("hose", o)
    expect(n).toBeGreaterThan(1500)
    // Keys a Part Number does not carry take their defaults.
    const p = parsePartNumber(transition.partNumber({ ...transition.defaults, qty: 40 }))
    expect(p?.options).toEqual(transition.defaults)
    // The kit's sub-assembly spool parses too.
    expect(parsePartNumber("clmp-clmp-spool-l36-6-150")).toEqual({
      builder_type: "spool",
      options: { endA: "tc", endB: "tc", len: 36, alloy: "t316l", size: 150 },
    })
  })

  it("manifold: the drop style is its own token (Sanitube scheme); the legacy glued form still parses", () => {
    let n = 0
    for (const o of manifoldSamples()) {
      const pn = manifold.partNumber(o)
      const t = pn.split("-")
      expect(t[4]).toBe(`d${String(o.drop).padStart(3, "0")}`)
      expect(t[5]).toBe({ tc: "clmp", bv: "bv", uqd: "uqd" }[o.dstyle])
      // Legacy: d100clmp glued (saved configurations, cart lines).
      const legacy = [...t.slice(0, 4), t[4] + t[5], ...t.slice(6)].join("-")
      const fromLegacy = parsePartNumber(legacy)
      const fromNew = parsePartNumber(pn)
      expect(fromLegacy).toEqual(fromNew)
      expect(fromLegacy?.builder_type).toBe("row-manifold")
      // Legacy → options → the current Part Number.
      expect(manifold.partNumber(fromLegacy!.options as Options)).toBe(pn)
      n++
    }
    expect(n).toBeGreaterThan(300)
    expect(parsePartNumber("clmp-clmp-rman-n12-d100clmp-p24-6-400")).toEqual(parsePartNumber("clmp-clmp-rman-n12-d100-clmp-p24-6-400"))
    expect(parsePartNumber("CLMP-CAP-RMAN-N4-D100BV-P18-6-400-IP")).toMatchObject({
      builder_type: "row-manifold",
      options: { dstyle: "bv", ends: "cap", drops: 4, pitch: 18, inst: "1" },
    })
  })

  it("kit: the Part Number is a hash of the canonical BOM (same parts → same number)", () => {
    const seen = new Map<string, string>()
    for (const o of kitSamples()) {
      const pn = kit.partNumber(o)
      expect(parsePartNumber(pn)).toEqual({ builder_type: "cdu-kit", kit_hash: pn.slice(8), options: null })
      const text = canonicalBomText(kit.bom(o))
      expect(pn).toBe(`kit-cdu-${sha256Hex(text).slice(0, 8)}`)
      const prev = seen.get(pn)
      if (prev !== undefined) expect(prev).toBe(text)
      seen.set(pn, text)
    }
    expect(seen.size).toBeGreaterThan(100)
    // Units do not change the part; the loop alone does not either (same parts).
    const base = kit.defaults as CduKitOptions
    expect(kit.partNumber({ ...base, units: 50 })).toBe(kit.partNumber(base))
    expect(kit.partNumber({ ...base, side: "fws", far: "tc" })).toBe(kit.partNumber(base))
    expect(kit.partNumber({ ...base, gasket: "ptfe" })).not.toBe(kit.partNumber(base))
    // Line order does not matter.
    const bom = kit.bom(base)
    expect(kitPartNumber({ ...bom, lines: bom.lines.slice().reverse() })).toBe(kit.partNumber(base))
  })

  it("rejects anything that is not a builder Part Number", () => {
    for (const s of ["14AM76-150", "kit-cdu-xyz", "clmp-fl150-tspool-l12-6-201", "clmp-fl150-tspool-l12-6-200-200", "clmp-clmp-rman-n12-d100-clmp-p24-6-400-nf-ra20", "clmp-clmp-rman-n12-d100clmp-p24-6-400-nf-ra20", "clmp-clmp-rman-n12-d100-xyz-p24-6-400", "clmp-clmp-rman-n12-d100-clmp-p24-6", "clmp-clmp-rman-n12-d100-clmp-clmp-p24-6-400", "a-b-c", ""]) {
      expect(parsePartNumber(s)).toBeNull()
    }
  })
})

// ---------------------------------------------------------------- sha256

describe("sha256 (pure TS)", () => {
  it("matches node:crypto", () => {
    for (const s of ["", "abc", "kit-cdu µ 1-1/2\" ✓ 𝄞", "a".repeat(1000)]) {
      expect(sha256Hex(s)).toBe(crypto.createHash("sha256").update(s, "utf8").digest("hex"))
    }
  })
})

// ---------------------------------------------------------------- BOM rules

describe("CDU kit BOM (spec 'BOM rules', per CDU, per port)", () => {
  it("Boyd 10U, TCS, hard pipe 36\", butterfly valves, short strainer", () => {
    const { options, ignored } = kit.decode(new URLSearchParams("cdu=boyd-10u&side=tcs&run=hard&len=36&iso=bfv&strainer=short"))
    expect(ignored).toEqual([])
    const bom = buildBom("cdu-kit", options)
    expect(bom.units).toBe(1)
    expect(bom.lines.map((l) => [l.role, l.qty_per_unit])).toEqual([
      ["spool", 2],
      ["ferrule", 6], // 2 spool weld ends × 2 ports + 1 facility TC end × 2 ports
      ["clamp", 10], // (2 base + 2 valve) × 2 ports + 2 strainer
      ["gasket_epdm", 10],
      ["valve_bfv", 2],
      ["strainer", 1], // supply side only
    ])
    expect(line(bom, "spool")).toMatchObject({ kind: "fabricated", lead_time: "custom", part_number: "clmp-clmp-spool-l36-6-150", candidates: [] })
    expect(line(bom, "ferrule").candidates).toEqual(["14AM76-150", "14WMP6-150"])
    expect(line(bom, "clamp").candidates).toEqual(["13MHHM-150", "13MHHM-100-150"])
    expect(line(bom, "gasket_epdm").candidates).toEqual(["GTCE-150"])
    expect(line(bom, "valve_bfv").candidates).toEqual(["TCBFN6-150"])
    expect(line(bom, "strainer")).toMatchObject({ candidates: [], part_number: "clmp-clmp-strn-short-m20-6-150" })
    expect(kit.leadTime(options).kind).toBe("custom")
    // Against the live catalog: the stocked lines resolve; spool, valve (TCBFN6 unpublished) and strainer do not.
    expect(bom.lines.map((l) => resolveLine(l))).toEqual([null, "14AM76-150", "13MHHM-100-150", "GTCE-150", null, null])
  })

  it("Vertiv CoolChip CDU 600: 2-1/2\" sanitary ports (SL-07625 Rev C Table 4.2), both loops", () => {
    const model = CDU_MODELS.find((m) => m.key === "vertiv-cdu-600")!
    expect(model).toMatchObject({ port: "tc250", label: "Vertiv CoolChip CDU 600" })
    expect(model.source).toContain("SL-07625")
    expect(model.source).toContain("https://www.vertiv.com/")
    for (const side of ["tcs", "fws"] as const) {
      const { options, ignored } = kit.decode({ cdu: "vertiv-cdu-600", side })
      expect(ignored).toEqual([])
      expect(options.port).toBe("tc250")
      const bom = kit.bom({ ...options, run: "hard", far: "tc", iso: "bv", strainer: "short" })
      expect(line(bom, "ferrule").candidates).toEqual(["14AM76-250", "14WMP6-250"])
      expect(line(bom, "clamp").candidates).toEqual(["13MHHM-250"])
      expect(line(bom, "gasket_epdm").candidates).toEqual(["GTCE-250"])
      expect(line(bom, "valve_bv").candidates).toEqual(["TCBVS-250"])
      expect(line(bom, "spool").part_number).toBe("clmp-clmp-spool-l36-6-250")
      expect(line(bom, "strainer").part_number).toBe("clmp-clmp-strn-short-m20-6-250")
      expect(kit.weight(options).per_unit_lb).toBeGreaterThan(0)
      expect(kit.describe(options)).toContain('VERTIV COOLCHIP CDU 600, 2-1/2" TC PORTS')
    }
    // The 2-1/2" ferrule row matches Vertiv's 77.5 mm flange diameter.
    expect(endConnectionRow("tc", 250).max_od_in * 25.4).toBeCloseTo(77.5, 0)
    expect(kit.decode({ cdu: "vertiv-cdu-600", port: "tc150" })).toMatchObject({ options: { port: "tc250" }, ignored: ["port"] })
    expect(kit.validate({ ...kit.defaults, cdu: "vertiv-cdu-600", port: "tc250" }).ok).toBe(true)
  })

  it("spares: +10% gaskets rounded up, 1 clamp per kit; units multiply", () => {
    const o = { ...(kit.defaults as CduKitOptions), cdu: "boyd-10u" as const, iso: "bfv" as const, strainer: "short" as const, spares: "1" as const, units: 4 }
    const bom = kit.bom(o)
    expect(line(bom, "clamp").qty_per_unit).toBe(11)
    expect(line(bom, "gasket_epdm").qty_per_unit).toBe(11)
    expect(bom.units).toBe(4)
    const noValve = kit.bom({ ...o, iso: "none", strainer: "none" }) // 4 joints → +1 gasket
    expect(line(noValve, "gasket_epdm").qty_per_unit).toBe(5)
    expect(line(noValve, "clamp").qty_per_unit).toBe(5)
  })

  it("FWS hose to an ANSI 150 flange (2\")", () => {
    const { options } = kit.decode({ port: "tc200", side: "fws", run: "hose", len: "36" })
    expect(options.far).toBe("fl150")
    const bom = kit.bom(options)
    expect(bom.lines.map((l) => [l.role, l.qty_per_unit])).toEqual([
      ["hose", 2],
      ["clamp", 4],
      ["gasket_epdm", 4],
      ["adapter_fl150", 2],
    ])
    expect(line(bom, "hose")).toMatchObject({ kind: "sku", candidates: [], part_number: "clmp-clmp-hose-l36-br-6-200", lead_time: "custom" })
    expect(line(bom, "adapter_fl150").candidates).toEqual(["FLGTC6-200"])
    expect(bom.lines.map((l) => resolveLine(l))).toEqual([null, "13MHHM-200", "GTCE-200", "FLGTC6-200"])
    // A custom hose length is fabricated.
    expect(line(kit.bom({ ...options, len: 40 }), "hose").kind).toBe("fabricated")
  })

  it("far end, DN ports, gaskets and alloy pick the right templates", () => {
    const base = kit.defaults as CduKitOptions
    expect(line(kit.bom({ ...base, far: "npt", port: "tc100" }), "adapter_npt").candidates).toEqual(["22MP6-100", "21MP6-100"])
    expect(line(kit.bom({ ...base, far: "grv" }), "adapter_grv").candidates).toEqual([])
    expect(line(kit.bom({ ...base, gasket: "sil" }), "gasket_sil").candidates).toEqual(["GTCSW-150"])
    expect(line(kit.bom({ ...base, alloy: "t304l" }), "ferrule").candidates).toEqual(["14AM74-150", "14WMP4-150"])
    const dn = kit.bom({ ...base, port: "dn80" })
    expect(line(dn, "adapter_dn")).toMatchObject({ qty_per_unit: 2, candidates: [], size_code: 300 })
    expect(kit.standardRange({ ...base, port: "dn80" }).reasons.map((r) => r.code)).toEqual(["dn_port_confirm"])
    expect(line(kit.bom({ ...base, iso: "bv" }), "valve_bv").candidates).toEqual(["TCBVS-150"])
  })

  it("no kit can be Instant today: every run is a welded spool or an unstocked hose", () => {
    for (const o of kitSamples()) {
      const bom = kit.bom(o)
      expect(bom.lines.some((l) => resolveLine(l, o.units) === null)).toBe(true)
    }
  })

  it("kit rules come from bom-templates.json", () => {
    expect(KIT_RULES).toMatchObject({ ports_per_cdu: 2, base_joints_per_port: 2, joints_per_valve: 2, joints_per_strainer: 2, spare_clamps_per_kit: 1 })
  })
})

describe("strainer, hose, manifold and transition BOMs", () => {
  it("strainer: the strainer plus its install clamps and gaskets; isolation adds 2 joints", () => {
    const bom = strainer.bom(strainer.defaults)
    expect(bom.lines.map((l) => [l.role, l.qty_per_unit])).toEqual([
      ["strainer", 1],
      ["clamp", 2],
      ["gasket_epdm", 2],
    ])
    const iso = strainer.bom({ ...(strainer.defaults as StrainerOptions), iso: "1", dp: "1", qty: 3 })
    expect(iso.units).toBe(3)
    expect(iso.lines.filter((l) => l.size_code === 200).map((l) => [l.role, l.qty_per_unit])).toEqual([
      ["strainer", 1],
      ["clamp", 4],
      ["gasket_epdm", 4],
      ["valve_bv", 2],
    ])
    expect(iso.lines.filter((l) => l.size_code === 50).map((l) => l.role)).toEqual(["cap_tc", "clamp", "gasket_epdm"])
    expect(strainer.leadTime(strainer.defaults).kind).toBe("custom") // no strainer stocked (B1)
  })

  it("hose: stocked standard lengths are SKU lines (none stocked → Quote)", () => {
    const h = hose.defaults as HoseOptions
    for (const len of [24, 36, 48, 72]) expect(line(hose.bom({ ...h, len }), "hose").kind).toBe("sku")
    expect(line(hose.bom({ ...h, len: 60 }), "hose").kind).toBe("fabricated")
    expect(line(hose.bom({ ...h, sleeve: "armor" }), "hose").kind).toBe("fabricated")
    expect(line(hose.bom({ ...h, ends: "tc-fl150" }), "clamp").qty_per_unit).toBe(1)
    expect(hose.leadTime(h).kind).toBe("custom")
  })

  it("manifold: informative fabricated breakdown, units = 2 for a supply/return pair", () => {
    const m = manifold.defaults as RowManifoldOptions
    const bom = manifold.bom(m)
    expect(bom.units).toBe(2)
    expect(bom.lines.every((l) => l.kind === "fabricated" && l.lead_time === "custom")).toBe(true)
    expect(bom.lines[0].label).toBe('Header tube, 4" T316L A270, cut 278-3/4" (2 sticks, welded joint)')
    expect(bom.lines[1]).toMatchObject({ role: "tube", qty_per_unit: 12 })
    expect(line(bom, "ferrule").candidates).toEqual(["14AM76-100", "14WMP6-100"])
    expect(bom.lines.filter((l) => l.role === "doc").map((l) => l.label)).toEqual([
      "Hydrostatic test certificate (included)",
      "MTRs by heat number (included)",
    ])
    expect(manifold.bom({ ...m, pair: "0" }).units).toBe(1)
    const bv = manifold.bom({ ...m, dstyle: "bv", ends: "cap" })
    expect(line(bv, "valve_bv")).toMatchObject({ qty_per_unit: 12, candidates: ["TCBVS-100"] })
    expect(line(bv, "cap_weld")).toMatchObject({ qty_per_unit: 1, candidates: ["16W6P-400"] })
  })

  it("transition: fabricated breakdown + the stocked adapter shortcut", () => {
    const t = transition.defaults as TransitionOptions
    const bom = transition.bom(t)
    expect(bom.lines.map((l) => l.role)).toEqual(["tube", "ferrule", "end_fabricated"])
    expect(bom.lines.every((l) => l.kind === "fabricated")).toBe(true)
    const red = transition.bom({ ...t, odb: 150 })
    expect(line(red, "reducer_bw").candidates).toEqual(["31W6P-200150"])
    expect(transition.stockedAlternative!(t)).toMatchObject({ role: "adapter_fl150", kind: "sku", candidates: ["FLGTC6-200"] })
    expect(resolveLine(transition.stockedAlternative!({ ...t, b: "fnpt" })!)).toBe("22MP6-200")
    expect(transition.stockedAlternative!({ ...t, b: "grv" })).toBeNull()
    expect(transition.stockedAlternative!({ ...t, odb: 150 })).toBeNull()
    expect(transition.stockedAlternative!({ ...t, a: "mil" })).toBeNull()
  })

  it("candidate expansion skips a range placeholder with no range at that size", () => {
    expect(candidatesFor("clamp", { s: 200 })).toEqual(["13MHHM-200"])
    expect(candidatesFor("clamp", { s: 50 })).toEqual(["13MHHM-050", "13MHHM-050-075"])
    expect(candidatesFor("cap_tc", { d: "6", s: 1000 })).toEqual(["16AMP6-1000"])
  })
})

// ---------------------------------------------------------------- geometry and weight

describe("geometry and weight", () => {
  it("transition: tube weight + both End Connection masses", () => {
    const g = transitionGeometry(transition.defaults as TransitionOptions)
    const t = tubeDims(200)
    const tubeLen = 12 - endConnectionRow("tc", 200).length_in - endConnectionRow("fl150", 200).length_in
    expect(g.tubeStraight).toBeCloseTo(tubeLen, 9)
    expect(g.tubeVolumeIn3).toBeCloseTo((Math.PI / 4) * (t.od ** 2 - t.id ** 2) * tubeLen, 9)
    expect(g.approxWeightLb).toBeCloseTo(
      g.tubeVolumeIn3 * 0.29 + endConnectionRow("tc", 200).mass_lb + endConnectionRow("fl150", 200).mass_lb,
      9
    )
    expect(transition.weight(transition.defaults).per_unit_lb).toBeCloseTo(g.approxWeightLb, 9)
    expect(g.reducer).toBeNull()
  })

  it("transition: a concentric reducer of B16.9 length behind End B when reducing", () => {
    const g = transitionGeometry({ ...(transition.defaults as TransitionOptions), odb: 150, len: 12 })
    expect(g.reducer!.x0).toBeCloseTo(12 - 2.44 - 3, 9)
    expect(g.reducer!.x1).toBeCloseTo(12 - 2.44, 9)
    expect(g.reducer!.length).toBe(3)
    expect(g.ends.b.sizeCode).toBe(150)
    expect(g.segments.map((s) => s.style)).toEqual(["tube", "cone"])
    expect(g.segments[1]).toMatchObject({ r0: 1, r1: 0.75 })
    const short = { ...(transition.defaults as TransitionOptions), odb: 150, len: 4 }
    expect(transition.standardRange(short).reasons.map((r) => r.code)).toEqual(["ends_overlap"])
  })

  it("manifold: header length = (drops − 1) × pitch + 2 × end allowance; cut list and weight", () => {
    const m = manifold.defaults as RowManifoldOptions
    expect(manifoldHeaderLength(m)).toBe(11 * 24 + 2 * 8)
    const g = manifoldGeometry(m)
    expect(g.header.length).toBe(280)
    expect(g.header.tubeLength).toBeCloseTo(280 - 2 * endConnectionRow("tc", 400).length_in, 9)
    expect(g.cutList).toMatchObject({ drops: 12, header_sticks: 2 })
    expect(g.cutList.drop_stub_in).toBeCloseTo(7 - 2 - endConnectionRow("tc", 100).length_in, 9)
    expect(g.cutList.port_stubs.map((p) => p.role)).toEqual(["fill", "drain", "vent"])
    const drops = g.branches.filter((b) => b.role === "drop")
    expect(drops.map((d) => d.x)).toEqual(Array.from({ length: 12 }, (_, i) => 8 + 24 * i))
    expect(manifold.standardRange(m).reasons.map((r) => r.code)).toEqual(["header_over_stick"])
    const w = manifold.weight(m)
    expect(w.per_unit_lb).toBeCloseTo(g.approxWeightLb, 9)
    expect(w.parts.reduce((s, p) => s + p.lb, 0)).toBeCloseTo(w.per_unit_lb, 9)
    // Header tube alone: π/4(OD² − ID²) × length × density.
    const t = tubeDims(400)
    expect(w.parts[0].lb).toBeCloseTo((Math.PI / 4) * (t.od ** 2 - t.id ** 2) * g.header.tubeLength * 0.29, 9)
    const shortRow = { ...m, drops: 8, pitch: 24 }
    expect(manifold.standardRange(shortRow).ok).toBe(true)
    expect(manifold.standardRange({ ...m, drops: 4, pitch: 6, drop: 150, dstyle: "bv" }).reasons.map((r) => r.code)).toContain("pitch_tight")
    expect(manifold.standardRange({ ...m, drops: 4, pitch: 6 }).ok).toBe(true)
    const bv = manifoldGeometry({ ...m, dstyle: "bv" })
    expect(manifold.weight({ ...m, dstyle: "bv" }).per_unit_lb - g.approxWeightLb).toBeCloseTo(12 * 3, 9)
    expect(bv.bbox.maxY).toBeCloseTo(7 + 3.5, 9)
  })

  it("weights round once to 0.1 lb; totals are the rounded weight × units", () => {
    expect(roundLb(88.64)).toBe(88.6)
    expect(roundLb(88.65)).toBe(88.7)
    expect(totalLb(88.64, 2)).toBe(177.2) // not round(177.28) = 177.3
    expect(totalLb(0.1, 3)).toBe(0.3)
    expect(formatLb(88.6)).toBe("88.6")
    expect(formatLb(177.2)).toBe("177.2")
    expect(formatLb(9)).toBe("9.0")
    expect(formatLb(1234.56)).toBe("1,234.6")
    for (const o of manifoldSamples()) {
      const w = manifold.weight(o).per_unit_lb
      expect(totalLb(w, 2)).toBeCloseTo(2 * roundLb(w), 9)
    }
  })

  it("kit weight sums its lines; strainer and hose weights include their parts", () => {
    const w = kit.weight(kit.defaults)
    expect(w.parts.length).toBe(kit.bom(kit.defaults).lines.length)
    expect(w.per_unit_lb).toBeGreaterThan(0)
    for (const b of [strainer, hose]) {
      const ww = b.weight(b.defaults)
      expect(ww.parts.reduce((s, p) => s + p.lb, 0)).toBeCloseTo(ww.per_unit_lb, 9)
    }
  })

  it("every End Connection row has a non-negative mass; bw ends weigh nothing", () => {
    for (const r of END_CONNECTION_ROWS) expect(r.mass_lb).toBeGreaterThanOrEqual(0)
    for (const r of END_CONNECTION_ROWS.filter((x) => x.code === "bw")) expect(r.mass_lb).toBe(0)
    // Every builder size has a row for every end it offers.
    for (const s of [100, 150, 200, 250, 300, 400, 600, 800]) {
      for (const c of ["tc", "mil", "fil", "pbs", "tbs", "bw", "fl150", "fl300", "mnpt", "fnpt", "grv", "bwp", "cap"] as const) {
        expect(() => endConnectionRow(c, s)).not.toThrow()
      }
    }
  })
})

// ---------------------------------------------------------------- spec blocks

describe("spec blocks", () => {
  it("state alloy, finish, weld, A380, test pressure and certs; the manifold cites OCP", () => {
    const m = manifold.specBlock(manifold.defaults)
    for (const s of ["OCP guideline", "T316L", "32 Ra", "Inert-gas welded", "ASTM A380", "150 psig", "MTRs by heat number"]) expect(m).toContain(s)
    expect(manifold.specBlock({ ...(manifold.defaults as RowManifoldOptions), finish: "20", docs: ["pass"] })).toContain("20 Ra max ID finish")
    expect(transition.specBlock(transition.defaults)).toContain("ASME B16.5 Class 150 raised-face flange")
    expect(kit.specBlock(kit.defaults)).toContain("PG25")
    expect(strainer.specBlock(strainer.defaults)).toContain("841 µm")
    expect(hose.specBlock({ ...(hose.defaults as HoseOptions), ends: "tc-npt" })).toContain("male NPT thread")
  })

  it("manifold: a connection shared by the drops and the header ends is named once", () => {
    const m = manifold.defaults as RowManifoldOptions
    const tcCount = (o: RowManifoldOptions) => manifold.specBlock(o).split("3-A tri-clamp ferrule").length - 1
    expect(manifold.specBlock(m)).toContain("3-A tri-clamp ferrule drops and both header ends.")
    expect(manifold.specBlock({ ...m, ends: "cap" })).toContain("3-A tri-clamp ferrule drops and header inlet, welded end cap far end.")
    expect(manifold.specBlock({ ...m, dstyle: "bv", ends: "fl150" })).toContain(
      "each drop a sanitary branch with tri-clamp isolation ball valve; ASME B16.5 Class 150 raised-face flange on both header ends."
    )
    for (const o of manifoldSamples()) {
      expect(tcCount(o)).toBeLessThanOrEqual(1)
      // No sentence is repeated.
      const sentences = manifold.specBlock(o).split(". ")
      expect(new Set(sentences).size).toBe(sentences.length)
    }
  })

  it("manifold: test pressure only with hydro, the pair sentence only with pair=1", () => {
    const m = manifold.defaults as RowManifoldOptions
    expect(manifold.specBlock(m)).toContain("Hydrostatically tested at 150 psig.")
    expect(manifold.specBlock({ ...m, docs: ["mtr"] })).not.toContain("psig")
    expect(manifold.specBlock({ ...m, docs: [] })).not.toMatch(/Hydrostatic|Documentation/)
    expect(manifold.specBlock(m)).toContain(" Supplied as a supply and return pair (2 manifolds).")
    expect(manifold.specBlock({ ...m, pair: "0" })).not.toContain("pair")
    expect(manifold.specBlock({ ...m, docs: ["pass", "weldmap"] })).toContain("Documentation: passivation certificate to ASTM A380, weld map.")
  })

  it("manifold: every option changes the Spec Block text", () => {
    const m = manifold.defaults as RowManifoldOptions
    const base = manifold.specBlock(m)
    const toggles: Partial<RowManifoldOptions>[] = [
      { header: 600 },
      { drops: 8 },
      { pitch: 30 },
      { drop: 150 },
      { dstyle: "bv" },
      { dstyle: "uqd" },
      { ends: "fl150" },
      { ends: "grv" },
      { ends: "cap" },
      { pair: "0" },
      { alloy: "t304l" },
      { finish: "20" },
      { fill: "0" },
      { inst: "1" },
      { docs: ["hydro"] },
      { docs: ["mtr"] },
      { docs: ["hydro", "mtr", "pass"] },
      { docs: ["hydro", "mtr", "weldmap"] },
    ]
    for (const t of toggles) expect(manifold.specBlock({ ...m, ...t })).not.toBe(base)
    expect(manifold.specBlock({ ...m, alloy: "t304l" })).toContain("T304L stainless steel")
    expect(manifold.specBlock({ ...m, finish: "20" })).toContain("20 Ra max ID finish")
    expect(manifold.specBlock({ ...m, fill: "0" })).not.toContain("fill point")
    expect(manifold.specBlock({ ...m, inst: "1" })).toContain("instrument ports")
  })

  it("manifold: each checked document adds a quoted BOM line; hydro and MTRs say (included)", () => {
    const m = manifold.defaults as RowManifoldOptions
    const docs = (o: RowManifoldOptions) => manifold.bom(o).lines.filter((l) => l.role === "doc")
    const all = docs({ ...m, docs: ["hydro", "mtr", "pass", "weldmap"] })
    expect(all.map((l) => l.label)).toEqual([
      "Hydrostatic test certificate (included)",
      "MTRs by heat number (included)",
      "Passivation certificate (ASTM A380), quoted",
      "Weld map, quoted",
    ])
    for (const l of all) expect(l).toMatchObject({ kind: "fabricated", lead_time: "custom", qty_per_unit: 1, candidates: [] })
    expect(docs({ ...m, docs: [] })).toEqual([])
    expect(docs({ ...m, docs: ["weldmap"] }).map((l) => l.label)).toEqual(["Weld map, quoted"])
  })

  it("kit: switching the alloy to 304L changes the Spec Block, the BOM descriptions and the Part Number", () => {
    for (const run of ["hard", "hose"] as const)
      for (const far of ["tc", "fl150", "npt", "grv"] as const) {
        const o316 = { ...(kit.defaults as CduKitOptions), run, far, strainer: "short" as const, alloy: "t316l" as const }
        const o304 = { ...o316, alloy: "t304l" as const }
        const s304 = kit.specBlock(o304)
        expect(s304).not.toBe(kit.specBlock(o316))
        expect(s304).toContain("T304L")
        expect(s304).not.toMatch(/T316L (spools|ferrules|ASME|NPT|IPS)/)
        expect(kit.partNumber(o304)).not.toBe(kit.partNumber(o316))
        const labels304 = kit.bom(o304).lines.map((l) => l.label).join("\n")
        expect(labels304).not.toBe(kit.bom(o316).lines.map((l) => l.label).join("\n"))
        for (const l of kit.bom(o304).lines.filter((x) => ["spool", "ferrule"].includes(x.role) || /^adapter_(fl150|npt|grv)$/.test(x.role))) {
          expect(l.label).toContain("T304L")
          expect(l.material).toBe("T304L")
        }
        if (run === "hard") expect(s304).toContain("welded T304L spools")
      }
  })

  it("kit and strainer: every material the Spec Block states is the one on its BOM line", () => {
    for (const o of kitSamples()) {
      for (const alloy of ["t316l", "t304l"] as const) {
        const oo = { ...o, alloy }
        const bom = kit.bom(oo)
        const spec = kit.specBlock(oo)
        const of = (role: string) => bom.lines.find((l) => l.role === role)
        // Every alloy named is a line's material (a 316L strainer can sit in a 304L kit).
        for (const al of spec.match(/T3\d\dL?/g) ?? []) expect(bom.lines.map((l) => l.material)).toContain(al)
        if (of("spool")) expect(spec).toContain(`welded ${of("spool")!.material} spools`)
        if (of("ferrule")) expect(spec).toContain(`${of("ferrule")!.material} ferrules`)
        else expect(spec).not.toContain("ferrules")
        expect(spec).toContain(`heavy-duty ${of("clamp")!.material} single-pin clamps`)
        if (of("strainer")) expect(spec).toContain(`${of("strainer")!.material} inline tri-clamp strainer`)
        else expect(spec).not.toContain("strainer")
      }
    }
    const sb = strainer.bom(strainer.defaults)
    const ss = strainer.specBlock(strainer.defaults)
    expect(ss.startsWith(`${sb.lines[0].material} stainless steel inline tri-clamp strainer`)).toBe(true)
    expect(ss).toContain(`heavy-duty ${sb.lines[1].material} clamps`)
  })

  it("no alloy is hard-coded: clamp and strainer materials come from bom-templates.json and are named on the line", () => {
    const templates = JSON.parse(fs.readFileSync(path.join(ROOT, "shared/cpq/dimensions/bom-templates.json"), "utf8")).roles as {
      role: string
      label: string
      material?: string
    }[]
    const clampT = templates.find((r) => r.role === "clamp")!
    const strainerT = templates.find((r) => r.role === "strainer")!
    expect(clampT.material).toBe("T304")
    expect(strainerT.material).toBe("T316L")
    for (const bom of [kit.bom(kit.defaults), strainer.bom(strainer.defaults), hose.bom(hose.defaults), manifold.bom({ ...(manifold.defaults as RowManifoldOptions), dstyle: "bv" })]) {
      for (const l of bom.lines.filter((x) => x.role === "clamp")) {
        expect(l.material).toBe(clampT.material)
        expect(l.label.startsWith(`${clampT.label}, ${clampT.material}, `)).toBe(true)
      }
    }
    const st = kit.bom({ ...(kit.defaults as CduKitOptions), strainer: "long" }).lines.find((l) => l.role === "strainer")!
    expect(st).toMatchObject({ material: "T316L" })
    expect(st.label.startsWith(`${strainerT.label}, T316L, `)).toBe(true)
    const src = fs.readFileSync(path.join(ROOT, "shared/cpq/ts/spec-block.ts"), "utf8")
    expect(src).not.toMatch(/T304 (single-pin )?clamps|316L inline/)
  })

  it("kit: a grooved far end (no stocked SKU) still gives 304L and 316L kits different Part Numbers", () => {
    const o = { ...(kit.defaults as CduKitOptions), run: "hose" as const, far: "grv" as const, port: "tc200" as const }
    expect(kit.bom(o).lines.some((l) => l.role === "ferrule")).toBe(false)
    expect(kit.partNumber({ ...o, alloy: "t304l" })).not.toBe(kit.partNumber(o))
  })
})

// ---------------------------------------------------------------- result line

describe("resultSummary (the one-line result under the headline)", () => {
  it("kit: units, parts summed over every CDU, Quote with the promise while a line is unstocked", () => {
    const o = { ...(kit.defaults as CduKitOptions), units: 4 }
    const r = resultSummary("cdu-kit", o)
    expect(r).toEqual({
      units: 4,
      units_label: "4 CDUs",
      parts: [
        { key: "hose", label: "hoses", qty: 8 },
        { key: "ferrule", label: "ferrules", qty: 8 },
        { key: "clamp", label: "clamps", qty: 16 },
        { key: "gasket", label: "gaskets", qty: 16 },
      ],
      parts_label: "8 hoses, 8 ferrules, 16 clamps, 16 gaskets",
      price_total: null,
      pricing_mode: "quote", // no braided hose is stocked: custom before any resolve
      lead_label: "Custom production, 3–6 weeks",
      quote_promise: "Firm quote within 1 business day, held 90 days",
    })
    const hard = resultSummary("cdu-kit", { ...o, run: "hard", iso: "bv", strainer: "short", spares: "1" })
    expect(hard.parts_label).toBe("8 spools, 24 ferrules, 44 clamps, 44 gaskets, 8 valves, 4 strainers")
    expect(resultSummary("cdu-kit", { ...o, units: 1, far: "fl150" }).units_label).toBe("1 CDU")
    expect(resultSummary("cdu-kit", { ...o, far: "fl150" }).parts.map((p) => p.key)).toEqual(["hose", "clamp", "gasket", "adapter"])
  })

  it("follows the resolve: Instant shows the total and the stock lead time, Quote never a price", () => {
    const o = { ...(kit.defaults as CduKitOptions), units: 2 }
    const instant = resultSummary("cdu-kit", o, null, { pricing_mode: "instant", price_total: 812.4 })
    expect(instant).toMatchObject({ pricing_mode: "instant", price_total: 812.4, lead_label: "Ships in 1–2 business days", quote_promise: null })
    const quote = resultSummary("cdu-kit", o, null, { pricing_mode: "quote", price_total: 999 })
    expect(quote).toMatchObject({ pricing_mode: "quote", price_total: null, lead_label: "Custom production, 3–6 weeks" })
    // A resolve response's BOM ({ lines: bom, units }) works the same as the shared BOM.
    const resolved = { lines: kit.bom(o).lines.map((l) => ({ role: l.role, qty_per_unit: l.qty_per_unit, lead_time: "stock" as const })), units: 2 }
    expect(resultSummary("cdu-kit", o, resolved, null)).toMatchObject({ pricing_mode: null, lead_label: "Ships in 1–2 business days", parts_label: "4 hoses, 4 ferrules, 8 clamps, 8 gaskets" })
  })

  it("manifold and transition: the units alone; strainer and hose: the install parts, not the unit itself", () => {
    expect(resultSummary("row-manifold", manifold.defaults)).toMatchObject({ units_label: "2 manifolds", parts: [], parts_label: "", pricing_mode: "quote" })
    expect(resultSummary("row-manifold", { ...(manifold.defaults as RowManifoldOptions), pair: "0" }).units_label).toBe("1 manifold")
    expect(resultSummary("transition", { ...(transition.defaults as TransitionOptions), qty: 8 })).toMatchObject({
      units_label: "8 spools",
      parts: [],
      quote_promise: "Firm quote within 1 business day, held 90 days",
    })
    expect(resultSummary("strainer", { ...(strainer.defaults as StrainerOptions), qty: 3 }).parts_label).toBe("6 clamps, 6 gaskets")
    expect(resultSummary("strainer", { ...(strainer.defaults as StrainerOptions), iso: "1", qty: 1 }).parts_label).toBe("4 clamps, 4 gaskets, 2 valves")
    expect(resultSummary("hose", hose.defaults)).toMatchObject({ units_label: "1 hose", parts_label: "2 clamps, 2 gaskets" })
    expect(resultSummary("hose", { ...(hose.defaults as HoseOptions), ends: "tc-npt", qty: 1 }).parts_label).toBe("1 clamp, 1 gasket")
  })
})

// ---------------------------------------------------------------- sync guard

describe("sync-cpq-shared", () => {
  it("--check passes: every generated copy matches shared/cpq", () => {
    const out = execFileSync(process.execPath, [path.join(ROOT, "scripts/sync-cpq-shared.mjs"), "--check"], { encoding: "utf8" })
    expect(out).toContain("3 targets in sync")
    expect(out).toContain(`tables ${CPQ_TABLES_HASH}`)
  })

  it("CPQ_TABLES_HASH = sha256 over dimensions/*.json (name\\0bytes\\0), 12 hex", () => {
    const dir = path.join(ROOT, "shared/cpq/dimensions")
    const h = crypto.createHash("sha256")
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json")).sort()) {
      h.update(Buffer.from(f + "\0", "utf8"))
      h.update(fs.readFileSync(path.join(dir, f)))
      h.update(Buffer.from("\0", "utf8"))
    }
    expect(CPQ_TABLES_HASH).toBe(h.digest("hex").slice(0, 12))
    const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, "cad-service/cpq_shared/MANIFEST.json"), "utf8"))
    expect(manifest.tables_hash).toBe(CPQ_TABLES_HASH)
  })
})

// ---------------------------------------------------------------- samples

function manifoldSamples(): RowManifoldOptions[] {
  const out: RowManifoldOptions[] = []
  const d = manifold.defaults as RowManifoldOptions
  for (const header of [300, 400, 600, 800])
    for (const dstyle of ["tc", "bv", "uqd"] as const)
      for (const ends of ["tc", "fl150", "grv", "cap"] as const)
        for (const finish of ["32", "20"] as const)
          for (const fill of ["1", "0"] as const)
            for (const inst of ["0", "1"] as const)
              out.push({ ...d, header, dstyle, ends, finish, fill, inst, drop: header === 300 ? 150 : 100, drops: 2 + (header % 47), pitch: 6 + (header % 91), alloy: header === 600 ? "t304l" : "t316l", docs: header === 800 ? [] : ["hydro", "pass"] })
  return out
}

function transitionSamples(): TransitionOptions[] {
  const out: TransitionOptions[] = []
  const sizes = [100, 150, 200, 250, 300, 400, 600, 800]
  for (const a of ["tc", "mil", "fil", "pbs", "tbs", "bw"] as const)
    for (const b of ["fl150", "fl300", "mnpt", "fnpt", "grv", "bwp"] as const)
      for (let i = 0; i < sizes.length; i++)
        for (const odb of [sizes[i], sizes[(i + 3) % sizes.length]])
          out.push({ a, b, od: sizes[i], odb, len: 2 + ((i * 7.375) % 70), alloy: i % 2 ? "t304l" : "t316l", qty: 1 + i })
  return out
}

function strainerSamples(): StrainerOptions[] {
  const out: StrainerOptions[] = []
  for (const size of [100, 150, 200, 250, 300, 400, 600])
    for (const body of ["short", "long"] as const)
      for (const mesh of ["20", "40", "100"] as const)
        for (const iso of ["0", "1"] as const) for (const dp of ["0", "1"] as const) out.push({ size, body, mesh, iso, dp, qty: 2 })
  return out
}

function hoseSamples(): HoseOptions[] {
  const out: HoseOptions[] = []
  for (const size of [50, 75, 100, 150, 200, 250, 300, 400])
    for (const ends of ["tc-tc", "tc-npt", "tc-fl150"] as const)
      for (const cover of ["braid", "silicone", "ptfe"] as const)
        for (const sleeve of ["none", "armor", "fire"] as const)
          for (const len of [12, 36, 240]) {
            if (size < 100 && ends !== "tc-tc") continue
            out.push({ size, len, ends, cover, sleeve, qty: 1 })
          }
  return out
}

function kitSamples(): CduKitOptions[] {
  const out: CduKitOptions[] = []
  const d = kit.defaults as CduKitOptions
  for (const port of ["tc100", "tc150", "tc200", "tc250", "tc300", "tc400", "dn50", "dn80"] as const)
    for (const run of ["hard", "hose"] as const)
      for (const far of ["tc", "fl150", "npt", "grv"] as const)
        for (const iso of ["none", "bfv", "bv"] as const)
          for (const st of ["none", "short", "long"] as const)
            out.push({ ...d, port, run, far, iso, strainer: st, gasket: port === "tc300" ? "sil" : "epdm", spares: iso === "bv" ? "1" : "0", units: 1 + (out.length % 7), len: [24, 36, 50][out.length % 3] })
  return out
}
