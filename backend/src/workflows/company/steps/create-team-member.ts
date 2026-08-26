import type { TeamMemberRole } from "../../../modules/company/types/role";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

type Input = { company_id: string; role: TeamMemberRole };

export const createTeamMemberStep = createStep(
  "create-team-member",
  async (input: Input, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const employee = await companyService.createEmployees({
      company_id: input.company_id,
      role: input.role,
    });
    return new StepResponse(employee, employee.id);
  },
  async (employeeId, { container }) => {
    if (!employeeId) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.deleteEmployees(employeeId);
  }
);
