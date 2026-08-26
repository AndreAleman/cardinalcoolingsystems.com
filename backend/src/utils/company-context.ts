import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";

export type TeamMemberRole = "member" | "manager" | "admin";

export type CompanyContext = {
  teamMemberId: string;
  companyId: string;
  role: TeamMemberRole;
};

type CustomerGraph = {
  id: string;
  employee?: {
    id: string;
    is_admin?: boolean | null;
    company?: { id: string } | null;
  } | null;
} | null | undefined;

/*
  Pure seam: given the customer → employee → company graph, decide the
  Company context. Null means "not a Team Member of any Company".
  Role is derived from the legacy is_admin flag until the role enum
  (ticket #4) replaces it.
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
    role: employee.is_admin ? "admin" : "member",
  };
}

/*
  Resolve the Company for a signed-in customer. This is the ONLY place
  the storefront's Company is decided — never from a header, cookie or
  hostname (ADR-0004).
*/
export async function resolveCompanyContext(
  container: MedusaContainer,
  customerId: string
): Promise<CompanyContext | null> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["id", "employee.id", "employee.is_admin", "employee.company.id"],
    filters: { id: customerId },
  });
  return companyContextFromCustomer(customer as CustomerGraph);
}
