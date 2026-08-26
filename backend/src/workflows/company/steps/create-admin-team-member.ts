import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

export const createAdminTeamMemberStep = createStep(
  "create-admin-team-member",
  async (input: { company_id: string }, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const employee = await companyService.createEmployees({
      company_id: input.company_id,
      is_admin: true,
    });
    return new StepResponse(employee, employee.id);
  },
  async (employeeId, { container }) => {
    if (!employeeId) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.deleteEmployees(employeeId);
  }
);
