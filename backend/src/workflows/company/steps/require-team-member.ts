import { MedusaError } from "@medusajs/framework/utils";
import type { MedusaContainer } from "@medusajs/framework/types";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

/* The Team Member must belong to the Company named in the URL. */
export async function requireTeamMemberInCompany(
  container: MedusaContainer,
  companyId: string,
  employeeId: string
) {
  const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
  const [employee] = await companyService.listEmployees({ id: employeeId, company_id: companyId });
  if (!employee) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Team Member not found in this Company");
  }
  return employee;
}
