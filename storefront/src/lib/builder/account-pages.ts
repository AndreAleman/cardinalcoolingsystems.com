// Per-account pages (plan B15, spec "Per-account pages, first 20" + Ecolab): /[cc]/for/[slug],
// noindex and left out of the sitemap. One template, this data file.
//
// Rules (B13/B15): `trigger` and `connection` stay null until verified from a primary source.
// Never guess a port size. Boyd is filled from its 10U datasheet (1.5" tri-clamp). Every other
// company renders the data-center catalog cut at posted prices and asks for connection sizes.

import type { CduKitOptions, CduPort } from "@lib/cpq/shared"

export type AccountConnection = {
  /** The equipment the connection belongs to, e.g. "Boyd 10U CDU". */
  equipment: string
  /** What the page says, e.g. '1.5" tri-clamp supply and return ports (Boyd 10U CDU)'. */
  label: string
  /** CDU port of the connection, which pre-fills the kit builder. */
  port: CduPort
  /** A known CDU model in the kit builder (B13), when there is one. */
  cdu: CduKitOptions["cdu"] | null
  source: { title: string; url: string }
}

export type AccountPage = {
  slug: string
  company: string
  /** Verified trigger event (funding, expansion, product launch), with its source; null = unverified. */
  trigger: { text: string; source: { title: string; url: string } } | null
  /** Verified connection from the company's own datasheet; null = ask for connection sizes. */
  connection: AccountConnection | null
}

export const BOYD_10U_DATASHEET = {
  title: "Boyd 10U Cooling Distribution Unit datasheet",
  url: "https://info.boydcorp.com/hubfs/Thermal/Liquid-Cooling/Boyd-10U-Cooling-Distribution-Unit-CDU.pdf",
}

export const ACCOUNT_PAGES: readonly AccountPage[] = [
  { slug: "nortek-dcc", company: "Nortek DCC", trigger: null, connection: null },
  {
    slug: "boyd",
    company: "Boyd",
    trigger: null,
    connection: {
      equipment: "Boyd 10U CDU",
      label: '1.5" sanitary tri-clamp supply and return ports (Boyd 10U CDU)',
      port: "tc150",
      cdu: "boyd-10u",
      source: BOYD_10U_DATASHEET,
    },
  },
  { slug: "vertiv", company: "Vertiv", trigger: null, connection: null },
  { slug: "aaon-basx", company: "AAON / BASX", trigger: null, connection: null },
  { slug: "motivair", company: "Motivair", trigger: null, connection: null },
  { slug: "munters", company: "Munters", trigger: null, connection: null },
  { slug: "stulz", company: "STULZ", trigger: null, connection: null },
  { slug: "chilldyne-daikin", company: "Chilldyne / Daikin", trigger: null, connection: null },
  { slug: "nvent", company: "nVent", trigger: null, connection: null },
  { slug: "accelevation", company: "Accelevation", trigger: null, connection: null },
  { slug: "advanced-thermal-solutions", company: "Advanced Thermal Solutions", trigger: null, connection: null },
  { slug: "arizon-datacool", company: "Arizon / DataCool", trigger: null, connection: null },
  { slug: "airsys", company: "AIRSYS", trigger: null, connection: null },
  { slug: "baltimore-aircoil", company: "Baltimore Aircoil", trigger: null, connection: null },
  { slug: "evapco", company: "EVAPCO", trigger: null, connection: null },
  { slug: "mckinstry", company: "McKinstry", trigger: null, connection: null },
  { slug: "hermanson", company: "Hermanson", trigger: null, connection: null },
  { slug: "southland", company: "Southland", trigger: null, connection: null },
  { slug: "tas-energy", company: "TAS Energy", trigger: null, connection: null },
  { slug: "harder", company: "Harder", trigger: null, connection: null },
  { slug: "ecolab", company: "Ecolab", trigger: null, connection: null },
]

export function accountPage(slug: string): AccountPage | null {
  const s = (slug ?? "").toLowerCase()
  return ACCOUNT_PAGES.find((p) => p.slug === s) ?? null
}

/** The kit-builder link for a verified connection: /build/cdu-kit?cdu=…&port=… (no country prefix). */
export function kitLinkFor(c: AccountConnection): string {
  const q = new URLSearchParams()
  if (c.cdu && c.cdu !== "none") q.set("cdu", c.cdu)
  q.set("port", c.port)
  return `/build/cdu-kit?${q.toString()}`
}
