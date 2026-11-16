// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// BOM line helpers: expand bom-templates.json patterns into candidate SKUs, build lines, derive the
// lead time. Used by every builder (bom.ts is the public entry point).

import { sizeToken } from "./units"
import { ASSEMBLIES, BOM_SIZE_RANGES, bomRole, tubeSize } from "./tables"
import type { Bom, BomLine, BomLineKind, LeadTime, LeadTimeKind, SizeCode } from "./types"

export type CandidateVars = {
  /** Alloy digit "4" | "6". */
  d?: string
  /** Size code. */
  s?: SizeCode
  /** Second size code (reducers). */
  s2?: SizeCode
}

/** Expands one pattern; null when a placeholder has no value (e.g. no {sr} range at that size). */
export function expandPattern(pattern: string, v: CandidateVars): string | null {
  let out = pattern
  if (out.indexOf("{sr}") >= 0) {
    const range = v.s === undefined ? undefined : BOM_SIZE_RANGES[sizeToken(v.s)]
    if (!range) return null
    out = out.split("{sr}").join(range)
  }
  if (out.indexOf("{s2}") >= 0) {
    if (v.s2 === undefined) return null
    out = out.split("{s2}").join(sizeToken(v.s2))
  }
  if (out.indexOf("{s}") >= 0) {
    if (v.s === undefined) return null
    out = out.split("{s}").join(sizeToken(v.s))
  }
  if (out.indexOf("{d}") >= 0) {
    if (!v.d) return null
    out = out.split("{d}").join(v.d)
  }
  return out
}

/** Candidate SKUs for a role, preferred first, deduplicated. Empty = none stocked. */
export function candidatesFor(role: string, v: CandidateVars): string[] {
  const out: string[] = []
  for (const p of bomRole(role).patterns) {
    const sku = expandPattern(p, v)
    if (sku && out.indexOf(sku) < 0) out.push(sku)
  }
  return out
}

/** A line's lead time: stock only for a SKU line with at least one candidate. */
export function lineLeadTime(kind: BomLineKind, candidates: string[]): LeadTimeKind {
  return kind === "sku" && candidates.length > 0 ? "stock" : "custom"
}

export type LineInput = {
  role: string
  /** Template role whose patterns give the candidates (defaults to `role`). */
  template?: string
  label: string
  qty: number
  kind?: BomLineKind
  vars?: CandidateVars
  candidates?: string[]
  part_number?: string
  size_code?: SizeCode
  note?: string
}

export function line(input: LineInput): BomLine {
  const kind: BomLineKind = input.kind ?? "sku"
  const candidates = input.candidates ?? (input.vars ? candidatesFor(input.template ?? input.role, input.vars) : [])
  const out: BomLine = {
    role: input.role,
    label: input.label,
    candidates,
    qty_per_unit: input.qty,
    kind,
    lead_time: lineLeadTime(kind, candidates),
  }
  if (input.part_number !== undefined) out.part_number = input.part_number
  if (input.size_code !== undefined) out.size_code = input.size_code
  if (input.note !== undefined) out.note = input.note
  return out
}

/** Template label for a role ("TC ferrule, long weld"). */
export function roleLabel(role: string): string {
  return bomRole(role).label
}

/** Size label ('1-1/2"'). */
export function sizeLabel(size: SizeCode): string {
  return tubeSize(size).label
}

/**
 * Static lead time of a BOM: custom when any line is fabricated or has no candidate SKU (B1: it can
 * never resolve). The resolver may still turn a "stock" BOM custom when a candidate is not
 * published or short of stock.
 */
export function leadTimeOfBom(bom: Bom): LeadTime {
  const custom = bom.lines.some((l) => l.lead_time === "custom")
  return leadTimeOf(custom ? "custom" : "stock")
}

export function leadTimeOf(kind: LeadTimeKind): LeadTime {
  return { kind, label: kind === "stock" ? ASSEMBLIES.lead_time.stock : ASSEMBLIES.lead_time.custom }
}

/** The quote promise shown with every Quote-mode configuration. */
export const QUOTE_PROMISE: string = ASSEMBLIES.lead_time.quote_promise
