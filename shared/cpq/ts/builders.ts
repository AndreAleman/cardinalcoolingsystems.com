// The builder registry: builder_type → BuilderDef. Every "any builder" operation (decode a link,
// resolve, part number, BOM, drawing) looks the builder up here; nothing switches on the type.

import { CDU_KIT_BUILDER } from "./builder-cdu-kit"
import { ROW_MANIFOLD_BUILDER } from "./builder-row-manifold"
import { TRANSITION_BUILDER } from "./builder-transition"
import { STRAINER_BUILDER } from "./builder-strainer"
import { HOSE_BUILDER } from "./builder-hose"
import type { BuilderDef } from "./builder-def"
import type { BuilderType, OptionsByType, Options, ParamSource, DecodeResult } from "./types"

export const BUILDERS: { readonly [T in BuilderType]: BuilderDef<OptionsByType[T]> } = {
  "cdu-kit": CDU_KIT_BUILDER,
  "row-manifold": ROW_MANIFOLD_BUILDER,
  transition: TRANSITION_BUILDER,
  strainer: STRAINER_BUILDER,
  hose: HOSE_BUILDER,
}

/** In page order (spec build order). */
export const BUILDER_TYPES: readonly BuilderType[] = ["cdu-kit", "row-manifold", "transition", "strainer", "hose"]

export function isBuilderType(x: unknown): x is BuilderType {
  return typeof x === "string" && Object.prototype.hasOwnProperty.call(BUILDERS, x)
}

/** Throws on an unknown builder type. */
export function getBuilder<T extends BuilderType>(type: T): BuilderDef<OptionsByType[T]>
export function getBuilder(type: string): BuilderDef<Options>
export function getBuilder(type: string): BuilderDef<Options> {
  if (!isBuilderType(type)) throw new Error(`Unknown builder type: ${String(type)}`)
  return BUILDERS[type] as unknown as BuilderDef<Options>
}

/** Forgiving decode for any builder (URL query or JSON body). */
export function decodeBuilderOptions(type: string, src: ParamSource | null | undefined): DecodeResult<Options> {
  return getBuilder(type).decode(src)
}

/** Builder by its page path ("/build/cdu-kit", with or without a country prefix), or null. */
export function builderForPath(path: string): BuilderDef<Options> | null {
  const clean = path.split("?")[0].replace(/\/+$/, "")
  for (const t of BUILDER_TYPES) {
    const b = getBuilder(t as string)
    if (clean === b.path || clean.endsWith(b.path)) return b
  }
  return null
}
