import type { CompanyContext } from "./company-context";

export type CompanyGate =
  | { ok: true; context: CompanyContext; status: "approved" }
  | { ok: false; code: "no_company" | "company_pending" | "company_declined"; http: 403 | 404 };

type CompanyStatus = "pending" | "approved" | "declined";

/*
  Pure seam: may this Team Member use Dashboard data routes? Only an
  Approved Company's Team Members may (ADR-0003). The storefront turns
  `company_pending` into the waiting screen.
*/
export function gateCompany(
  context: CompanyContext | null,
  status: CompanyStatus | null | undefined
): CompanyGate {
  if (!context || !status) return { ok: false, code: "no_company", http: 404 };
  if (status === "pending") return { ok: false, code: "company_pending", http: 403 };
  if (status === "declined") return { ok: false, code: "company_declined", http: 403 };
  return { ok: true, context, status };
}
