// Part Numbers for every builder (plan B11) and their parser (missing on Sanitube).
//
// Scheme (Sanitube's spool pattern, so Todd's shop reads them without translation):
//   <endA>-<endB>-<type>-...-<alloyDigit>-<size>
//   End tokens are the End Connection pn_token (tc → "clmp", Sanitube H27). Alloy digit 4 = 304L,
//   6 = 316L. Sizes = nominal × 100, 3 digits (050, 150, 1000). Lengths: 12 → "12", 36.125 → "36p125".
//
//   Transition Spool  <a>-<b>-tspool-l<len>-<d>-<od>[-<odb>]
//                     clmp-fl150-tspool-l12-6-200; reducing: clmp-fl150-tspool-l12-6-200-150.
//                     Ends sorted by End Connection sort order (A×B = B×A); on a reducing
//                     transition A keeps its place, because the first size belongs to it.
//   Row Manifold      <endA>-<endB>-rman-n<drops>-d<drop><dstyle>-p<pitch>-<d>-<header>[-ra20][-nf][-ip]
//                     clmp-clmp-rman-n12-d100clmp-p24-6-400. dstyle token clmp | bv | uqd.
//                     ends=cap → clmp-cap (TC inlet, welded cap at the far end).
//                     Suffixes in this order: -ra20 (20 Ra ID), -nf (no fill/drain/vent), -ip
//                     (instrument ports). pair and docs do not change the part.
//   Strainer          clmp-clmp-strn-<short|long>-m<mesh>-6-<size>[-iso][-dp]   (316L body only)
//   Hose              clmp-<clmp|mnpt|fl150>-hose-l<len>-<br|sil|ptfe>-6-<size>[-armor|-fire]
//   Spool (kit run)   <endLo>-<endHi>-spool-l<len>-<d>-<size>   (Sanitube's spool pattern)
//   CDU Hookup Kit    kit-cdu-<first 8 hex of sha256(canonical BOM)>
//                     The canonical BOM is every line as role;kind;candidates|…;part_number;qty,
//                     sorted, joined with "\n". Units are not part of it (the kit is per CDU).

import { pnNumberToken, sizeToken } from "./units"
import { alloyOf, endConnectionType, endConnectionTypeByToken } from "./tables"
import { sha256Hex } from "./sha256"
import {
  DEFAULT_HOSE_OPTIONS,
  DEFAULT_ROW_MANIFOLD_OPTIONS,
  DEFAULT_STRAINER_OPTIONS,
  DEFAULT_TRANSITION_OPTIONS,
  HOSE_SIZES,
  MANIFOLD_DROP_SIZES,
  MANIFOLD_HEADER_SIZES,
  STRAINER_SIZES,
  TRANSITION_END_A,
  TRANSITION_END_B,
  TRANSITION_SIZES,
} from "./option-keys"
import type {
  AlloyKey,
  Bom,
  EndConnectionCode,
  HoseOptions,
  RowManifoldOptions,
  SizeCode,
  StrainerOptions,
  TransitionOptions,
} from "./types"

function sortedEnds(a: EndConnectionCode, b: EndConnectionCode) {
  return [endConnectionType(a), endConnectionType(b)].sort((x, y) => x.sort - y.sort)
}

const digitOf = (alloy: AlloyKey) => alloyOf(alloy).digit

// ---------------------------------------------------------------- builders

export function transitionPartNumber(o: TransitionOptions): string {
  const reducing = o.odb !== o.od
  const ends = reducing ? [endConnectionType(o.a), endConnectionType(o.b)] : sortedEnds(o.a, o.b)
  const parts = [
    ends[0].pn_token,
    ends[1].pn_token,
    "tspool",
    `l${pnNumberToken(o.len)}`,
    digitOf(o.alloy),
    sizeToken(o.od),
  ]
  if (reducing) parts.push(sizeToken(o.odb))
  return parts.join("-")
}

const DSTYLE_TOKEN: Record<RowManifoldOptions["dstyle"], string> = { tc: "clmp", bv: "bv", uqd: "uqd" }

/** Header end codes for a manifold `ends` option: both ends, except cap = TC inlet + welded cap. */
export function manifoldEndCodes(ends: RowManifoldOptions["ends"]): [EndConnectionCode, EndConnectionCode] {
  if (ends === "cap") return ["tc", "cap"]
  return [ends, ends]
}

export function manifoldPartNumber(o: RowManifoldOptions): string {
  const [a, b] = manifoldEndCodes(o.ends)
  const parts = [
    endConnectionType(a).pn_token,
    endConnectionType(b).pn_token,
    "rman",
    `n${o.drops}`,
    `d${sizeToken(o.drop)}${DSTYLE_TOKEN[o.dstyle]}`,
    `p${pnNumberToken(o.pitch)}`,
    digitOf(o.alloy),
    sizeToken(o.header),
  ]
  if (o.finish === "20") parts.push("ra20")
  if (o.fill === "0") parts.push("nf")
  if (o.inst === "1") parts.push("ip")
  return parts.join("-")
}

export function strainerPartNumber(o: StrainerOptions): string {
  const parts = ["clmp", "clmp", "strn", o.body, `m${o.mesh}`, "6", sizeToken(o.size)]
  if (o.iso === "1") parts.push("iso")
  if (o.dp === "1") parts.push("dp")
  return parts.join("-")
}

const HOSE_END_B: Record<HoseOptions["ends"], EndConnectionCode> = { "tc-tc": "tc", "tc-npt": "mnpt", "tc-fl150": "fl150" }
const HOSE_COVER_TOKEN: Record<HoseOptions["cover"], string> = { braid: "br", silicone: "sil", ptfe: "ptfe" }

/** End B code of a hose `ends` option (End A is always tc). */
export function hoseEndB(ends: HoseOptions["ends"]): EndConnectionCode {
  return HOSE_END_B[ends]
}

export function hosePartNumber(o: HoseOptions): string {
  const parts = [
    "clmp",
    endConnectionType(hoseEndB(o.ends)).pn_token,
    "hose",
    `l${pnNumberToken(o.len)}`,
    HOSE_COVER_TOKEN[o.cover],
    "6",
    sizeToken(o.size),
  ]
  if (o.sleeve !== "none") parts.push(o.sleeve)
  return parts.join("-")
}

/** Sanitube's spool Part Number: `{endLo}-{endHi}-spool-l{len}-{digit}-{size}`. */
export function spoolPartNumber(
  endA: EndConnectionCode,
  endB: EndConnectionCode,
  lengthIn: number,
  alloy: AlloyKey,
  size: SizeCode,
): string {
  const ends = sortedEnds(endA, endB)
  return [ends[0].pn_token, ends[1].pn_token, "spool", `l${pnNumberToken(lengthIn)}`, digitOf(alloy), sizeToken(size)].join("-")
}

/** Canonical BOM text hashed into the kit Part Number. */
export function canonicalBomText(bom: Bom): string {
  return bom.lines
    .map((l) => [l.role, l.kind, l.candidates.join("|"), l.part_number ?? "", String(l.qty_per_unit)].join(";"))
    .sort()
    .join("\n")
}

/** `kit-cdu-<8 hex of sha256(canonical BOM)>`: the same parts give the same Kit Part Number. */
export function kitPartNumber(bom: Bom): string {
  return `kit-cdu-${sha256Hex(canonicalBomText(bom)).slice(0, 8)}`
}

// ---------------------------------------------------------------- parser

export type ParsedPartNumber =
  | { builder_type: "cdu-kit"; kit_hash: string; options: null }
  | { builder_type: "transition"; options: TransitionOptions }
  | { builder_type: "row-manifold"; options: RowManifoldOptions }
  | { builder_type: "strainer"; options: StrainerOptions }
  | { builder_type: "hose"; options: HoseOptions }
  | {
      builder_type: "spool"
      options: { endA: EndConnectionCode; endB: EndConnectionCode; len: number; alloy: AlloyKey; size: SizeCode }
    }

const SIZE_RE = /^\d{3,4}$/
const LEN_RE = /^l(\d+(?:p\d+)?)$/

function lenOf(tok: string): number | null {
  const m = LEN_RE.exec(tok)
  return m ? Number(m[1].replace("p", ".")) : null
}
function sizeOf(tok: string | undefined, allowed: readonly number[]): number | null {
  if (!tok || !SIZE_RE.test(tok)) return null
  const n = Number(tok)
  return sizeToken(n) === tok && allowed.indexOf(n) >= 0 ? n : null
}
function alloyOfDigit(tok: string): AlloyKey | null {
  return tok === "6" ? "t316l" : tok === "4" ? "t304l" : null
}
function endOf(tok: string): EndConnectionCode | null {
  return endConnectionTypeByToken(tok)?.code ?? null
}

/** Remaining tokens must be exactly these optional flags, in order. */
function flagsOf(rest: string[], order: readonly string[]): Record<string, boolean> | null {
  const out: Record<string, boolean> = {}
  let i = 0
  for (const f of order) {
    out[f] = rest[i] === f
    if (out[f]) i++
  }
  return i === rest.length ? out : null
}

function parseTransition(t: string[]): ParsedPartNumber | null {
  if (t.length !== 6 && t.length !== 7) return null
  const a = endOf(t[0])
  const b = endOf(t[1])
  const len = lenOf(t[3])
  const alloy = alloyOfDigit(t[4])
  const od = sizeOf(t[5], TRANSITION_SIZES)
  const odb = t.length === 7 ? sizeOf(t[6], TRANSITION_SIZES) : od
  if (!a || !b || len === null || !alloy || od === null || odb === null) return null
  if (t.length === 7 && odb === od) return null
  if ((TRANSITION_END_A as readonly string[]).indexOf(a) < 0) return null
  if ((TRANSITION_END_B as readonly string[]).indexOf(b) < 0) return null
  return {
    builder_type: "transition",
    options: { ...DEFAULT_TRANSITION_OPTIONS, a: a as TransitionOptions["a"], b: b as TransitionOptions["b"], od, odb, len, alloy },
  }
}

function parseManifold(t: string[]): ParsedPartNumber | null {
  if (t.length < 8) return null
  const a = endOf(t[0])
  const b = endOf(t[1])
  let ends: RowManifoldOptions["ends"] | null = null
  if (a === "tc" && b === "cap") ends = "cap"
  else if (a && a === b && (a === "tc" || a === "fl150" || a === "grv")) ends = a
  const n = /^n(\d+)$/.exec(t[3])
  const d = /^d(\d{3})(clmp|bv|uqd)$/.exec(t[4])
  const p = /^p(\d+)$/.exec(t[5])
  const alloy = alloyOfDigit(t[6])
  const header = sizeOf(t[7], MANIFOLD_HEADER_SIZES)
  const flags = flagsOf(t.slice(8), ["ra20", "nf", "ip"])
  if (!ends || !n || !d || !p || !alloy || header === null || !flags) return null
  const drop = sizeOf(d[1], MANIFOLD_DROP_SIZES)
  if (drop === null) return null
  const dstyle = d[2] === "clmp" ? "tc" : (d[2] as "bv" | "uqd")
  return {
    builder_type: "row-manifold",
    options: {
      ...DEFAULT_ROW_MANIFOLD_OPTIONS,
      docs: DEFAULT_ROW_MANIFOLD_OPTIONS.docs.slice(),
      header,
      drops: Number(n[1]),
      pitch: Number(p[1]),
      drop,
      dstyle,
      ends,
      alloy,
      finish: flags.ra20 ? "20" : "32",
      fill: flags.nf ? "0" : "1",
      inst: flags.ip ? "1" : "0",
    },
  }
}

function parseStrainer(t: string[]): ParsedPartNumber | null {
  if (t.length < 7 || t[0] !== "clmp" || t[1] !== "clmp" || t[5] !== "6") return null
  const body = t[3] === "short" || t[3] === "long" ? t[3] : null
  const mesh = /^m(20|40|100)$/.exec(t[4])
  const size = sizeOf(t[6], STRAINER_SIZES)
  const flags = flagsOf(t.slice(7), ["iso", "dp"])
  if (!body || !mesh || size === null || !flags) return null
  return {
    builder_type: "strainer",
    options: {
      ...DEFAULT_STRAINER_OPTIONS,
      size,
      body,
      mesh: mesh[1] as StrainerOptions["mesh"],
      iso: flags.iso ? "1" : "0",
      dp: flags.dp ? "1" : "0",
    },
  }
}

function parseHose(t: string[]): ParsedPartNumber | null {
  if (t.length !== 7 && t.length !== 8) return null
  if (t[0] !== "clmp" || t[5] !== "6") return null
  const endB = endOf(t[1])
  const ends = (Object.keys(HOSE_END_B) as HoseOptions["ends"][]).find((k) => HOSE_END_B[k] === endB)
  const len = lenOf(t[3])
  const cover = (Object.keys(HOSE_COVER_TOKEN) as HoseOptions["cover"][]).find((k) => HOSE_COVER_TOKEN[k] === t[4])
  const size = sizeOf(t[6], HOSE_SIZES)
  const sleeve = t.length === 8 ? (t[7] === "armor" || t[7] === "fire" ? t[7] : null) : "none"
  if (!ends || len === null || !Number.isInteger(len) || !cover || size === null || !sleeve) return null
  return { builder_type: "hose", options: { ...DEFAULT_HOSE_OPTIONS, size, len, ends, cover, sleeve } }
}

function parseSpool(t: string[]): ParsedPartNumber | null {
  if (t.length !== 6) return null
  const endA = endOf(t[0])
  const endB = endOf(t[1])
  const len = lenOf(t[3])
  const alloy = alloyOfDigit(t[4])
  const size = /^\d{3,4}$/.test(t[5]) ? Number(t[5]) : null
  if (!endA || !endB || len === null || !alloy || size === null || sizeToken(size) !== t[5]) return null
  return { builder_type: "spool", options: { endA, endB, len, alloy, size } }
}

/**
 * Parses any builder Part Number back to its options (keys a Part Number does not carry, such as
 * qty, pair or docs, take their defaults). A kit Part Number gives only its BOM hash. Returns null
 * for anything else (e.g. a catalog SKU).
 */
export function parsePartNumber(pn: string): ParsedPartNumber | null {
  if (typeof pn !== "string") return null
  const s = pn.trim().toLowerCase()
  const kit = /^kit-cdu-([0-9a-f]{8})$/.exec(s)
  if (kit) return { builder_type: "cdu-kit", kit_hash: kit[1], options: null }
  const t = s.split("-")
  if (t.length < 3) return null
  const parse = Object.prototype.hasOwnProperty.call(PN_PARSERS, t[2]) ? PN_PARSERS[t[2]] : undefined
  return parse ? parse(t) : null
}

/** Type token (third token) → parser. */
const PN_PARSERS: Record<string, (t: string[]) => ParsedPartNumber | null> = {
  tspool: parseTransition,
  rman: parseManifold,
  strn: parseStrainer,
  hose: parseHose,
  spool: parseSpool,
}
