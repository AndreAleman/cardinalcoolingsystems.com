// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Public BOM entry point: buildBom(builder_type, options) → { lines, units }. The commerce stream's
// resolver looks each line's candidates up in Medusa (B1): the first published variant with a price
// > 0, a weight and enough stock prices it; a line with no such variant, or a fabricated line, makes
// the configuration Quote.

import { getBuilder } from "./builders"
import type { Bom, BuilderType, Options, OptionsByType } from "./types"

export { candidatesFor, expandPattern, leadTimeOf, leadTimeOfBom, line, QUOTE_PROMISE } from "./bom-lines"
export type { CandidateVars, LineInput } from "./bom-lines"

/** BOM for typed options of a builder. */
export function buildBom<T extends BuilderType>(builder_type: T, options: OptionsByType[T]): Bom
export function buildBom(builder_type: string, options: Options): Bom
export function buildBom(builder_type: string, options: Options): Bom {
  return getBuilder(builder_type).bom(options)
}

/** Total quantity of each line: qty_per_unit × units. */
export function bomTotals(bom: Bom): { role: string; label: string; qty_total: number }[] {
  return bom.lines.map((l) => ({ role: l.role, label: l.label, qty_total: l.qty_per_unit * bom.units }))
}
