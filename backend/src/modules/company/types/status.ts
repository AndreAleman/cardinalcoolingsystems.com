export const COMPANY_STATUSES = ["pending", "approved", "declined"] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];
export type CompanyDecision = Exclude<CompanyStatus, "pending">;

/*
  Pure seam: which status changes Cardinal may make (ADR-0003).
  pending → approved | declined; a Declined Company may be reinstated;
  an Approved Company is never flipped back — its Team is already using
  the Dashboard.
*/
export function canDecideCompany(from: CompanyStatus, to: CompanyDecision): boolean {
  if (from === "pending") return true;
  if (from === "declined") return to === "approved";
  return false;
}
