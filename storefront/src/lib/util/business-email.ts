// Client-side work-email check for the CAD gate (ported from Sanitube), for instant form feedback
// only. The backend is authoritative (the CAD stream's cad-request route; the signup list is
// backend/src/utils/signup-policy.ts FREE_MAIL_DOMAINS). Entries here are patterns, so this list
// is a superset of that one.

// Entries ending in ".*" match any TLD (yahoo.com, yahoo.co.uk, ...).
export const FREE_EMAIL_DOMAINS = [
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
  "126.com",
  "rocketmail.com",
  "tuta.io",
  "comcast.net",
  "att.net",
  "verizon.net",
  "sbcglobal.net",
  "bellsouth.net",
  "cox.net",
  "charter.net",
  "earthlink.net",
]

function matchesDomain(domain: string, entry: string): boolean {
  if (entry.endsWith(".*")) {
    const base = entry.slice(0, -2)
    // base + "." + one or two TLD labels (yahoo.com, yahoo.co.uk)
    return new RegExp(`^${base.replace(/\./g, "\\.")}\\.[a-z]{2,}(\\.[a-z]{2,})?$`).test(
      domain
    )
  }
  return domain === entry
}

/**
 * True when the email is on a company domain. Checks the domain and each
 * parent domain, so "mail.yahoo.co.uk" is treated as free webmail.
 */
export function isBusinessEmail(email: string): boolean {
  const at = email.lastIndexOf("@")
  if (at < 1) return false
  const domain = email.slice(at + 1).trim().toLowerCase()
  if (!domain.includes(".")) return false

  const labels = domain.split(".")
  for (let i = 0; i < labels.length - 1; i++) {
    const candidate = labels.slice(i).join(".")
    if (FREE_EMAIL_DOMAINS.some((entry) => matchesDomain(candidate, entry))) {
      return false
    }
  }
  return true
}

export const BUSINESS_EMAIL_MESSAGE = "Please use your work email address."
