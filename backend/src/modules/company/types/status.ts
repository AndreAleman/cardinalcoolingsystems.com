export const COMPANY_STATUSES = ["pending", "approved", "declined"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];
export type CompanyDecision = Exclude<CompanyStatus, "pending">;

/*
  Pure seam: which status changes Cardinal may make (ADR-0003).
  pending → approved | declined; a Declined Company may be reinstated.
  Instant access (2026-09-05): signups are born approved, so declining
  an Approved Company must work — it is the ban hammer for junk
  signups. The only no-ops are re-approving an Approved Company and
  re-declining a Declined one.
*/
export function canDecideCompany(from: CompanyStatus, to: CompanyDecision): boolean {
  if (from === "pending") return true;
  if (from === "declined") return to === "approved";
  return to === "declined";
}
