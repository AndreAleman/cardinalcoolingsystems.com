/*
  Pure seam: who gets instant access at signup (ADR-0007).

  A signup is born Approved only when its email domain is on the
  Approved Domain list — the companies Cardinal is actively emailing.
  Everyone else is born Pending and waits for Cardinal.

  Matching is exact-domain and case-insensitive. No subdomain
  wildcards: mail.acme.com is not acme.com.
*/

/* Free-mail providers can never be allowlisted: listing gmail.com
   would auto-approve every Gmail user on earth. */
export const FREE_MAIL_DOMAINS: ReadonlySet<string> = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.ca",
  "ymail.com",
  "rocketmail.com",
  "outlook.com",
  "hotmail.com",
  "hotmail.co.uk",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "zoho.com",
  "yandex.com",
  "yandex.ru",
  "fastmail.com",
  "hey.com",
  "tutanota.com",
  "tuta.io",
  "qq.com",
  "163.com",
  "126.com",
  "comcast.net",
  "att.net",
  "verizon.net",
  "sbcglobal.net",
  "bellsouth.net",
  "cox.net",
  "charter.net",
  "earthlink.net",
]);

/* "  Ada@Acme.COM " → "acme.com"; anything unusable → null. */
export function emailDomain(email: string | null | undefined): string | null {
  if (typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0) return null;
  return normalizeDomain(trimmed.slice(at + 1));
}

/* A bare domain as stored on the list; null when it is not one. */
export function normalizeDomain(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  const domain = raw.trim().toLowerCase().replace(/\.$/, "");
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
    return null;
  }
  return domain;
}

export function isFreeMailDomain(domain: string): boolean {
  return FREE_MAIL_DOMAINS.has(domain.toLowerCase());
}

/* May this domain ever sit on the Approved Domain list? */
export function isAllowlistable(domain: string | null): domain is string {
  return !!domain && !isFreeMailDomain(domain);
}

/*
  The status a new Company is born with. `isListed` answers "is this
  exact domain on the Approved Domain list?" — injected so this stays
  pure. A free-mail domain is Pending even if it somehow got listed.
*/
export function signupStatusFor(
  email: string | null | undefined,
  isListed: (domain: string) => boolean
): "approved" | "pending" {
  const domain = emailDomain(email);
  if (!isAllowlistable(domain)) return "pending";
  return isListed(domain) ? "approved" : "pending";
}

/*
  Domains from an outreach CSV (Instantly export). Reads the "Email"
  column by header name, so column order does not matter. Returns the
  unique allowlistable domains plus what was skipped and why.
*/
export function domainsFromOutreachCsv(csv: string): {
  domains: string[];
  skipped: { value: string; reason: "invalid" | "free_mail" }[];
} {
  const lines = csv.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return { domains: [], skipped: [] };
  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const col = header.findIndex((h) => h === "email" || h === "email address");
  if (col === -1) {
    throw new Error(`No "Email" column in CSV header: ${lines[0]}`);
  }
  const domains = new Set<string>();
  const skipped: { value: string; reason: "invalid" | "free_mail" }[] = [];
  for (const line of lines.slice(1)) {
    const value = (splitCsvLine(line)[col] ?? "").trim();
    const domain = emailDomain(value);
    if (!domain) {
      skipped.push({ value, reason: "invalid" });
    } else if (isFreeMailDomain(domain)) {
      skipped.push({ value, reason: "free_mail" });
    } else {
      domains.add(domain);
    }
  }
  return { domains: [...domains].sort(), skipped };
}

/* Minimal RFC-4180 line splitter: handles quoted fields with commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/*
  What an import should do. Already-listed domains are left alone, and
  the domain of a Declined Company is never re-listed by an import —
  a ban must not be quietly undone by the next outreach export.
*/
export function planDomainImport(
  csvDomains: string[],
  alreadyListed: Iterable<string>,
  declinedDomains: Iterable<string>
): { add: string[]; already: string[]; blocked: string[] } {
  const listed = new Set(alreadyListed);
  const declined = new Set(declinedDomains);
  const add: string[] = [];
  const already: string[] = [];
  const blocked: string[] = [];
  for (const d of new Set(csvDomains)) {
    if (declined.has(d)) blocked.push(d);
    else if (listed.has(d)) already.push(d);
    else add.push(d);
  }
  return { add, already, blocked };
}
