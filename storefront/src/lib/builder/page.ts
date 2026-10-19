// Server-side page helpers for the builder pages: the initial decode of the search params, the
// title-block date and canonical URLs. Pure (no Next APIs).

import { getBuilder, type BuilderType, type DecodeResult, type Options } from "@lib/cpq/shared"

export type SearchParams = Record<string, string | string[] | undefined>

export const SITE_URL = "https://cardinalcoolingsystems.com"

/** Forgiving decode of a page's search params; `prefill` fills keys the link doesn't set. */
export function decodePageOptions(type: BuilderType, searchParams: SearchParams | null | undefined, prefill?: Options): DecodeResult<Options> {
  const src: Record<string, string | readonly string[] | number | undefined> = {}
  for (const [k, v] of Object.entries(prefill ?? {})) src[k] = Array.isArray(v) ? v.join(",") : (v as string | number)
  for (const [k, v] of Object.entries(searchParams ?? {})) if (v !== undefined) src[k] = v
  return getBuilder(type as string).decode(src)
}

/** "10/18/2026" in Miami time (B7), for the drawing's DRAWN date. */
export function drawnDate(now: Date = new Date()): string {
  return now.toLocaleDateString("en-US", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" })
}

export function canonicalUrl(countryCode: string, path: string): string {
  return `${SITE_URL}/${countryCode}${path}`
}
