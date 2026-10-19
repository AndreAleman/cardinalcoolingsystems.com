/*
  Business Email rule (ported from Sanitube for CAD Requests, plan B7): an address on a company
  domain. Free webmail is rejected. Two lists, either one rejects:
  - FREE_MAIL_DOMAINS from signup-policy.ts (Cardinal's exact domains, ADR-0007);
  - the Sanitube wildcard list below. Entries are matched against the email's domain AND each of
    its parent domains, so "mail.yahoo.co.uk" matches "yahoo.co.uk". An entry ending in ".*"
    matches that label followed by any public suffix ("yahoo.*" matches yahoo.com, yahoo.co.uk,
    yahoo.fr).
  Logged-in customers are not checked (their account email was vetted at signup).
*/

import { MedusaError } from "@medusajs/framework/utils"
import { FREE_MAIL_DOMAINS } from "./signup-policy"

/** Shown to the visitor when a free webmail address is rejected. */
export const BUSINESS_EMAIL_MESSAGE = "Please use your company email address."

export const FREE_EMAIL_PATTERNS: readonly string[] = [
  "gmail.*",
  "googlemail.*",
  "yahoo.*",
  "ymail.*",
  "outlook.*",
  "hotmail.*",
  "live.*",
  "msn.*",
  "aol.*",
  "icloud.*",
  "me.com",
  "mac.com",
  "proton.me",
  "protonmail.*",
  "pm.me",
  "gmx.*",
  "mail.com",
  "zoho.*",
  "zohomail.*",
  "yandex.*",
  "hey.com",
  "fastmail.*",
  "tutanota.*",
  "qq.com",
  "163.com",
  "comcast.net",
  "att.net",
  "verizon.net",
  "sbcglobal.net",
]

// Public suffixes a ".*" entry may be followed by: one generic/country TLD, optionally preceded by
// a second-level label such as "co" / "com".
const SUFFIX_RE = /^(?:(?:co|com|net|org|ne|or)\.)?[a-z]{2,}$/

const EXACT = new Set<string>(FREE_MAIL_DOMAINS)
const WILDCARD_LABELS = new Set<string>()
for (const entry of FREE_EMAIL_PATTERNS) {
  if (entry.endsWith(".*")) WILDCARD_LABELS.add(entry.slice(0, -2))
  else if (!entry.includes(".")) WILDCARD_LABELS.add(entry)
  else EXACT.add(entry)
}

function isFreeDomain(domain: string): boolean {
  const labels = domain.split(".")
  // Check the domain itself and every parent with at least two labels.
  for (let i = 0; i <= labels.length - 2; i++) {
    const candidate = labels.slice(i).join(".")
    if (EXACT.has(candidate)) return true
    const head = labels[i]
    const rest = labels.slice(i + 1).join(".")
    if (WILDCARD_LABELS.has(head) && SUFFIX_RE.test(rest)) return true
  }
  return false
}

/** The lower-cased domain part of an email, or null if malformed. */
export function businessEmailDomain(email: string): string | null {
  const trimmed = (email || "").trim().toLowerCase()
  const at = trimmed.lastIndexOf("@")
  if (at < 1 || at === trimmed.length - 1) return null
  const domain = trimmed.slice(at + 1).replace(/\.$/, "")
  if (!domain.includes(".") || domain.split(".").some((l) => !l)) return null
  return domain
}

/** True when the email is on a company domain (not free webmail). */
export function isBusinessEmail(email: string): boolean {
  const domain = businessEmailDomain(email)
  if (!domain) return false
  return !isFreeDomain(domain)
}

/** Throws a 400 (MedusaError INVALID_DATA) with BUSINESS_EMAIL_MESSAGE for a non-business email. */
export function assertBusinessEmail(email: string): void {
  if (!isBusinessEmail(email)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, BUSINESS_EMAIL_MESSAGE)
  }
}
