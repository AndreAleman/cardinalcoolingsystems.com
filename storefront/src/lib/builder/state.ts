// Pure builder-state helpers (no React, no browser APIs; unit-tested in __tests__/state.test.ts):
// Share Link URLs, address-bar sync, applying one option change with the dependent defaults the
// shared decode applies to links, and the notice for ignored link params.

import {
  CDU_MODELS,
  getBuilder,
  type BuilderType,
  type CduKitOptions,
  type Options,
  type OptionValue,
} from "@lib/cpq/shared"

/** The country prefix of a storefront path ("/us"), or "" when there is none. */
export function countryPrefixOf(pathname: string): string {
  const m = /^\/([a-z]{2})(?=\/|$)/i.exec(pathname)
  return m ? `/${m[1].toLowerCase()}` : ""
}

/** Canonical query string of a configuration (`v=1&…`, every key in order). */
export function queryOf(type: BuilderType, options: Options): string {
  return getBuilder(type as string).encode(options)
}

/**
 * The Share Link for a configuration: same origin and country prefix, the builder's canonical
 * page path, the canonical query. A link from /build/cdu-kit/boyd-10u shares as /build/cdu-kit?…
 * (the options carry cdu=boyd-10u), so every configuration has exactly one link.
 */
export function shareUrlFor(href: string, type: BuilderType, options: Options): string {
  const u = new URL(href)
  const b = getBuilder(type as string)
  u.pathname = `${countryPrefixOf(u.pathname)}${b.path}`
  u.search = `?${b.encode(options)}`
  u.hash = ""
  return u.toString()
}

/** Address-bar URL while configuring: keeps the page path and hash, replaces the query. */
export function syncedUrlFor(href: string, type: BuilderType, options: Options): string {
  const u = new URL(href)
  u.search = `?${queryOf(type, options)}`
  return u.toString()
}

export function isUrlInSync(href: string, type: BuilderType, options: Options): boolean {
  return new URL(href).search === `?${queryOf(type, options)}`
}

export type ChangeResult = { ok: true; options: Options } | { ok: false; error: string }

/**
 * Applies one option change and the dependent defaults a buyer expects:
 * - CDU kit: picking a CDU model fixes its port (B13); changing the port by hand clears the model;
 *   switching the loop moves the far end to that loop's default when it was on the old default
 *   (TCS → tri-clamp, FWS → ANSI 150 flange).
 * - Transition: changing size A moves size B along while the spool is not reducing.
 * Returns the validated options, or the validation message.
 */
export function applyOptionChange(type: BuilderType, options: Options, key: string, value: OptionValue): ChangeResult {
  const b = getBuilder(type as string)
  let next: Options = { ...options, [key]: value }

  if (type === "cdu-kit") {
    const o = next as unknown as CduKitOptions
    if (key === "cdu") {
      const model = CDU_MODELS.find((m) => m.key === value)
      if (model?.port) next = { ...next, port: model.port }
    } else if (key === "port") {
      const model = CDU_MODELS.find((m) => m.key === o.cdu)
      if (model?.port && model.port !== value) next = { ...next, cdu: "none" }
    } else if (key === "side") {
      const farDefault = (side: unknown) => (side === "fws" ? "fl150" : "tc")
      if (options.far === farDefault(options.side)) next = { ...next, far: farDefault(value) }
    }
  } else if (type === "transition" && key === "od") {
    if (options.odb === options.od) next = { ...next, odb: value }
  }

  const res = b.validate(next)
  if (!res.ok) return { ok: false, error: res.errors.map((e) => e.message).join("; ") }
  return { ok: true, options: res.value }
}

const KEY_LABELS: Record<string, string> = { v: "link version" }

/** "Some settings in this link weren't valid and were reset: port, len." or null. */
export function ignoredParamsNotice(ignored: readonly string[]): string | null {
  if (!ignored.length) return null
  const keys = ignored.map((k) => KEY_LABELS[k] ?? k)
  return `Some settings in this link weren't valid and were reset to the default: ${keys.join(", ")}.`
}

/** Units of a configuration (the BOM's multiplier): CDUs, manifolds (2 for a pair), or the quantity. */
export function unitsOf(type: BuilderType, options: Options): number {
  return getBuilder(type as string).bom(options).units
}

/** Noun for one unit of a builder ("CDU", "manifold", "spool", "strainer", "hose"). */
export function unitNoun(type: BuilderType, n = 1): string {
  const one: Record<BuilderType, string> = {
    "cdu-kit": "CDU",
    "row-manifold": "manifold",
    transition: "spool",
    strainer: "strainer",
    hose: "hose",
  }
  const many: Record<BuilderType, string> = {
    "cdu-kit": "CDUs",
    "row-manifold": "manifolds",
    transition: "spools",
    strainer: "strainers",
    hose: "hoses",
  }
  return n === 1 ? one[type] : many[type]
}
