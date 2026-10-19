// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// The contract every builder implements (registered in builders.ts). One builder per file:
// builder-cdu-kit.ts, builder-row-manifold.ts, builder-transition.ts, builder-strainer.ts,
// builder-hose.ts. Code that handles "any builder" goes through the registry, never a switch.

import { decodeOptions, encodeQuery, validateOptions, type Normalize } from "./share-link"
import { leadTimeOfBom } from "./bom-lines"
import type {
  Bom,
  BomLine,
  BuilderType,
  DecodeResult,
  DisplayRow,
  KeySpec,
  LeadTime,
  OptionError,
  Options,
  ParamSource,
  StandardRange,
  ValidationResult,
  Weight,
} from "./types"

export type BuilderDef<O extends Options = Options, G = unknown> = {
  type: BuilderType
  /** Page path without the country prefix, e.g. "/build/transition". */
  path: string
  /** Builder name, e.g. "Transition Spool". */
  title: string
  /** Canonical keys, in canonical order. */
  keys: readonly KeySpec[]
  defaults: Readonly<O>
  /** Forgiving decode (URL or JSON body): invalid → default + `ignored`. */
  decode(src: ParamSource | null | undefined): DecodeResult<O>
  /** Canonical query string (every key, in order; `v=1` first). */
  encode(o: O): string
  /** Strict check of a typed options object (hard limits + cross-field). */
  validate(o: unknown): ValidationResult<O>
  /** Identity: `<builder_type>?<canonical query>`. Same options → same key. */
  configKey(o: O): string
  /** Share Link path: `<path>?<canonical query>`. */
  sharePath(o: O): string
  partNumber(o: O): string
  /** One-line description, e.g. '2" TRANSITION SPOOL 12" OAL TC X 150# FLG T316L'. */
  describe(o: O): string
  /** Label/value rows for a quote line's configuration_display. */
  display(o: O): DisplayRow[]
  /** Model geometry (inches), when the builder has one. */
  geometry?: (o: O) => G
  /** The leaves cad-service checks its own solid against (Sanitube `expected`, within 1e-3). */
  expected?: (o: O) => Record<string, unknown>
  /** True when the CAD Package includes a STEP (B8: transition and manifold only). */
  hasStep: boolean
  weight(o: O): Weight
  bom(o: O): Bom
  standardRange(o: O): StandardRange
  /** Paste-ready submittal paragraph. */
  specBlock(o: O): string
  leadTime(o: O): LeadTime
  /** A stocked part that does the same job (e.g. a TC × flange adapter instead of a custom transition). */
  stockedAlternative?: (o: O) => BomLine | null
}

export type BuilderSpec<O extends Options, G> = Omit<
  BuilderDef<O, G>,
  "defaults" | "decode" | "encode" | "validate" | "configKey" | "sharePath" | "leadTime"
> & {
  normalize?: Normalize<O>
  /** Cross-field hard-limit errors for validate(). */
  cross?: (o: O) => OptionError[]
  leadTime?: (o: O) => LeadTime
}

/** Fills the generic parts of a BuilderDef (decode/encode/validate/identity) from its keys. */
export function makeBuilder<O extends Options, G = unknown>(spec: BuilderSpec<O, G>): BuilderDef<O, G> {
  const { normalize, cross, leadTime, ...rest } = spec
  const encode = (o: O) => encodeQuery(spec.keys, o)
  const decode = (src: ParamSource | null | undefined) => decodeOptions<O>(spec.keys, src, normalize)
  const defaults = Object.freeze(decode({}).options) as Readonly<O>
  return {
    ...rest,
    defaults,
    decode,
    encode,
    validate: (o: unknown) => validateOptions<O>(spec.keys, o, cross),
    configKey: (o: O) => `${spec.type}?${encode(o)}`,
    sharePath: (o: O) => `${spec.path}?${encode(o)}`,
    leadTime: leadTime ?? ((o: O) => leadTimeOfBom(spec.bom(o))),
  }
}
