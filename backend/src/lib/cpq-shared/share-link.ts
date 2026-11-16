// GENERATED from shared/cpq. Do not edit.
// Edit shared/cpq/ and run: node scripts/sync-cpq-shared.mjs

// Share Link URL schema v1 for every builder (plan "URLs and options").
//   /build/transition?v=1&a=tc&b=fl150&od=200&odb=200&len=12&alloy=t316l&qty=1
//
// Generic over a builder's `keys` (KeySpec[]): the key order in `keys` is the canonical order, and
// the canonical query string (every key, in that order) is the Configuration's identity.
//
// Decoding is forgiving, as on Sanitube: a key that is present but invalid falls back to its default
// and is listed in `ignored`; a missing key silently takes its default; an unknown `v` is treated as 1
// and listed. Unknown keys are ignored silently (UTM tags etc.).

import { formatDecimalInches, isEighth, sizeToken } from "./units"
import type { DecodeResult, KeySpec, OptionError, Options, ParamSource, ValidationResult } from "./types"

export const SHARE_LINK_VERSION = "1"

/** Raw string of one key, or undefined. Arrays: first item (lists: joined with ","). */
export function readParam(p: ParamSource | null | undefined, key: string, list = false): string | undefined {
  if (!p) return undefined
  const sp = p as URLSearchParams
  if (typeof sp.get === "function" && typeof sp.has === "function") {
    return sp.has(key) ? (sp.get(key) as string) : undefined
  }
  const raw = (p as Record<string, unknown>)[key]
  if (raw === undefined || raw === null) return undefined
  if (Array.isArray(raw)) {
    if (list) return raw.map((x) => String(x)).join(",")
    return raw.length ? String(raw[0]) : undefined
  }
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") return String(raw)
  return undefined
}

const INT_RE = /^\d+$/
const DECIMAL_RE = /^(\d+(\.\d+)?|\.\d+)$/

/** Parses one raw value against its KeySpec; undefined = invalid. */
export function parseKeyValue(spec: KeySpec, raw: string): string | number | string[] | undefined {
  const t = raw.trim()
  switch (spec.type) {
    case "enum": {
      const v = t.toLowerCase()
      return spec.values.indexOf(v) >= 0 ? v : undefined
    }
    case "int": {
      if (!INT_RE.test(t)) return undefined
      const n = Number(t)
      return n >= spec.min && n <= spec.max ? n : undefined
    }
    case "inches": {
      if (!DECIMAL_RE.test(t)) return undefined
      const n = Number(t)
      if (!Number.isFinite(n) || !isEighth(n)) return undefined
      if (n < spec.min - 1e-9 || n > spec.max + 1e-9) return undefined
      return Math.round(n * 8) / 8
    }
    case "size": {
      if (!INT_RE.test(t)) return undefined
      const n = Number(t)
      return spec.values.indexOf(n) >= 0 ? n : undefined
    }
    case "list": {
      if (t === "") return []
      const items = t
        .split(",")
        .map((x) => x.trim().toLowerCase())
        .filter((x) => x !== "")
      for (const x of items) if (spec.values.indexOf(x) < 0) return undefined
      // Canonical: the order of `values`, no duplicates.
      return spec.values.filter((v) => items.indexOf(v) >= 0)
    }
  }
}

/** True when `value` is a valid, canonical value for the key. */
export function isValidKeyValue(spec: KeySpec, value: unknown): boolean {
  switch (spec.type) {
    case "enum":
      return typeof value === "string" && spec.values.indexOf(value) >= 0
    case "int":
      return typeof value === "number" && Number.isInteger(value) && value >= spec.min && value <= spec.max
    case "inches":
      return (
        typeof value === "number" &&
        Number.isFinite(value) &&
        isEighth(value) &&
        value >= spec.min - 1e-9 &&
        value <= spec.max + 1e-9
      )
    case "size":
      return typeof value === "number" && spec.values.indexOf(value) >= 0
    case "list":
      return (
        Array.isArray(value) &&
        value.every((x) => typeof x === "string" && spec.values.indexOf(x) >= 0) &&
        new Set(value as string[]).size === value.length
      )
  }
}

/** One key's canonical query value. */
export function encodeKeyValue(spec: KeySpec, value: unknown): string {
  switch (spec.type) {
    case "enum":
      return String(value)
    case "int":
      return String(value)
    case "inches":
      return formatDecimalInches(value as number)
    case "size":
      return sizeToken(value as number)
    case "list": {
      const items = value as string[]
      return spec.values.filter((v) => items.indexOf(v) >= 0).join(",")
    }
  }
}

function defaultOf(spec: KeySpec): string | number | string[] {
  return spec.type === "list" ? spec.default.slice() : spec.default
}

/** Defaults for every key. */
export function defaultOptions<O extends Options>(keys: readonly KeySpec[]): O {
  const o: Options = {}
  for (const k of keys) o[k.key] = defaultOf(k)
  return o as O
}

export type DecodeContext = {
  /** True when the key was present in the source (valid or not). */
  present: (key: string) => boolean
  /** True when the key was present AND valid. */
  given: (key: string) => boolean
  /** Report a key as ignored (deduplicated, kept in key order). */
  ignore: (key: string) => void
}

/** Builder hook that fills dependent defaults and resets cross-field failures. */
export type Normalize<O> = (o: O, ctx: DecodeContext) => O

/** Forgiving decode of every key, then the builder's `normalize` (dependent defaults, cross-field). */
export function decodeOptions<O extends Options>(
  keys: readonly KeySpec[],
  src: ParamSource | null | undefined,
  normalize?: Normalize<O>,
): DecodeResult<O> {
  const ignored: string[] = []
  const present: string[] = []
  const given: string[] = []
  const vRaw = readParam(src, "v")
  if (vRaw !== undefined && vRaw.trim() !== SHARE_LINK_VERSION) ignored.push("v")

  const o: Options = {}
  for (const spec of keys) {
    const raw = readParam(src, spec.key, spec.type === "list")
    if (raw === undefined) {
      o[spec.key] = defaultOf(spec)
      continue
    }
    present.push(spec.key)
    const v = parseKeyValue(spec, raw)
    if (v === undefined) {
      o[spec.key] = defaultOf(spec)
      ignored.push(spec.key)
    } else {
      o[spec.key] = v
      given.push(spec.key)
    }
  }
  const ctx: DecodeContext = {
    present: (k) => present.indexOf(k) >= 0,
    given: (k) => given.indexOf(k) >= 0,
    ignore: (k) => {
      if (ignored.indexOf(k) < 0) ignored.push(k)
    },
  }
  const options = normalize ? normalize(o as O, ctx) : (o as O)
  const order = ["v", ...keys.map((k) => k.key)]
  return { options, ignored: order.filter((k) => ignored.indexOf(k) >= 0) }
}

/** Canonical query string: `v=1` then every key in order. Commas in lists stay literal. */
export function encodeQuery<O extends Options>(keys: readonly KeySpec[], o: O): string {
  const parts = [`v=${SHARE_LINK_VERSION}`]
  for (const spec of keys) {
    const value = encodeURIComponent(encodeKeyValue(spec, o[spec.key])).replace(/%2C/g, ",")
    parts.push(`${spec.key}=${value}`)
  }
  return parts.join("&")
}

/** Strict check of a typed options object: every key present and canonical. */
export function validateOptions<O extends Options>(
  keys: readonly KeySpec[],
  o: unknown,
  cross?: (o: O) => OptionError[],
): ValidationResult<O> {
  if (!o || typeof o !== "object" || Array.isArray(o)) {
    return { ok: false, errors: [{ key: "options", message: "Options are missing" }] }
  }
  const rec = o as Record<string, unknown>
  const errors: OptionError[] = []
  const value: Options = {}
  for (const spec of keys) {
    const v = rec[spec.key]
    if (!isValidKeyValue(spec, v)) {
      errors.push({ key: spec.key, message: describeSpec(spec) })
      continue
    }
    value[spec.key] = spec.type === "list" ? encodeKeyValue(spec, v).split(",").filter((x) => x) : (v as string | number)
  }
  if (errors.length) return { ok: false, errors }
  const crossErrors = cross ? cross(value as O) : []
  if (crossErrors.length) return { ok: false, errors: crossErrors }
  return { ok: true, value: value as O }
}

function describeSpec(spec: KeySpec): string {
  switch (spec.type) {
    case "enum":
      return `${spec.key} must be one of ${spec.values.join(", ")}`
    case "int":
      return `${spec.key} must be a whole number ${spec.min}–${spec.max}`
    case "inches":
      return `${spec.key} must be ${spec.min}–${spec.max} in 1/8" steps`
    case "size":
      return `${spec.key} must be one of ${spec.values.map((v) => sizeToken(v)).join(", ")}`
    case "list":
      return `${spec.key} must be a list of ${spec.values.join(", ")}`
  }
}
