// Builder options for CAD Requests. The request body and the stored rows both carry a builder's
// canonical options object (shared/cpq/ts/option-keys.ts); everything else goes through the
// registry (getBuilder), never a switch on builder_type.

import { cadBlockingRangeReasons, getBuilder, isBuilderType, type BuilderDef, type BuilderType, type Options, type ParamSource } from "../cpq-shared"

export type ParsedBuilderOptions = {
  type: BuilderType
  builder: BuilderDef<Options>
  options: Options
}

export type ParseResult = { ok: true; value: ParsedBuilderOptions } | { ok: false; errors: string[] }

/**
 * Request input (POST /store/cad-requests): the builder's forgiving decode (accepts the canonical
 * options object or URL-style strings), then any invalid key is an error (CAD files are only made
 * for the configuration the buyer actually sees), then the strict cross-field check.
 * Missing keys take their defaults, as in a Share Link.
 */
export function parseBuilderOptions(type: unknown, raw: unknown): ParseResult {
  if (!isBuilderType(type)) return { ok: false, errors: [`Unknown builder_type: ${String(type)}`] }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, errors: ["options must be an object"] }
  }
  const builder = getBuilder(type as string)
  const { options, ignored } = builder.decode(raw as ParamSource)
  const bad = ignored.filter((k) => k !== "v")
  if (bad.length) return { ok: false, errors: bad.map((k) => `Invalid value for "${k}"`) }
  const v = builder.validate(options)
  if (v.ok === false) return { ok: false, errors: (v as { errors: { message: string }[] }).errors.map((e) => e.message) }
  return { ok: true, value: { type, builder, options: (v as { value: Options }).value } }
}

/** A stored row's options (canonical), or null when the type is unknown or they no longer validate. */
export function storedBuilderOptions(
  type: string | null | undefined,
  configuration: Record<string, unknown> | null | undefined,
): ParsedBuilderOptions | null {
  if (!isBuilderType(type)) return null
  const builder = getBuilder(type as string)
  const v = builder.validate(configuration ?? {})
  return v.ok === true ? { type, builder, options: (v as { value: Options }).value } : null
}

/** Builder name for admin and emails ("Transition Spool"), the raw type when unknown. */
export function builderTitle(type: string | null | undefined): string {
  return isBuilderType(type) ? getBuilder(type as string).title : String(type ?? "")
}

/** True when this builder's CAD Package includes a STEP (B8: transition and manifold only). */
export function builderHasStep(type: string | null | undefined): boolean {
  return isBuilderType(type) ? getBuilder(type as string).hasStep : false
}

// Advisory Standard Range codes live in shared/cpq (standard-range.ts) so the storefront's CAD
// panel refuses exactly what this route refuses.
export { CAD_ADVISORY_RANGE_CODES } from "../cpq-shared"

/** The Standard Range reasons that refuse CAD files (geometry that may not model or mislead). */
export function cadBlockingReasons(parsed: Pick<ParsedBuilderOptions, "builder" | "options">): { code: string; message: string }[] {
  return cadBlockingRangeReasons(parsed.builder.standardRange(parsed.options))
}
