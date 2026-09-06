import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";

import type { TeamMemberRole } from "../modules/company/types/role";
export type { TeamMemberRole };

export type CompanyContext = {
  teamMemberId: string;
  companyId: string;
  role: TeamMemberRole;
};

type CustomerGraph = {
  id: string;
  employee?: {
    id: string;
    role?: TeamMemberRole | null;
    company?: { id: string } | null;
  } | null;
} | null | undefined;

/*
  Pure seam: given the customer → employee → company graph, decide the
  Company context. Null means "not a Team Member of any Company".
*/
export function companyContextFromCustomer(
  customer: CustomerGraph
): CompanyContext | null {
  const employee = customer?.employee;
  const companyId = employee?.company?.id;
  if (!customer || !employee || !companyId) {
    return null;
  }
  return {
    teamMemberId: employee.id,
    companyId,
    role: employee.role ?? "member",
  };
}

/*
  Resolve the Company for a signed-in customer. This is the ONLY place
  the storefront's Company is decided — never from a header, cookie or
  hostname (ADR-0004).
*/
/*
  The caller's assigned Location (their home site), or null when none.
  A manager with a Location sees only orders/approvals tagged with it;
  anyone with NO Location falls back to their role rule company-wide.
*/
export async function resolveTeamMemberLocationId(
  container: MedusaContainer,
  customerId: string
): Promise<string | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.id", "employee.location.id"],
    filters: { id: customerId },
  });
  return ((customer as any)?.employee?.location?.id ?? null) as string | null;
}

export async function resolveCompanyContext(
  container: MedusaContainer,
  customerId: string
): Promise<CompanyContext | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.id", "employee.role", "employee.company.id"],
    filters: { id: customerId },
  });
  return companyContextFromCustomer(customer as CustomerGraph);
}
