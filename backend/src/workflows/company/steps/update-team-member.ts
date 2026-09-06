import type { TeamMemberRole } from "../../../modules/company/types/role";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import { requireTeamMemberInCompany } from "./require-team-member";
import { requireLocationInCompany } from "./manage-location";

type Input = {
  company_id: string;
  employee_id: string;
  role?: TeamMemberRole;
  spending_limit?: number;
  /** Home site. A string assigns (must be this Company's), null unassigns. */
  location_id?: string | null;
};

/* Change Role / Spending Limit / Location; the Team Member must belong to the Company in the URL. */
export const updateTeamMemberStep = createStep(
  "update-team-member",
  async (input: Input, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const before = await requireTeamMemberInCompany(container, input.company_id, input.employee_id);
    if (input.location_id) {
      await requireLocationInCompany(container, input.company_id, input.location_id);
    }
    const updated = await companyService.updateEmployees({
      id: input.employee_id,
      ...(input.role ? { role: input.role } : {}),
      ...(input.spending_limit !== undefined ? { spending_limit: input.spending_limit } : {}),
      ...(input.location_id !== undefined ? { location_id: input.location_id } : {}),
    });
    const employee = Array.isArray(updated) ? updated[0] : updated;
    return new StepResponse(employee, {
      id: before.id,
      role: before.role as TeamMemberRole,
      spending_limit: Number(before.spending_limit),
      location_id: ((before as any).location_id ?? null) as string | null,
    });
  },
  async (prev, { container }) => {
    if (!prev) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.updateEmployees({
      id: prev.id,
      role: prev.role,
      spending_limit: prev.spending_limit,
      location_id: prev.location_id,
    });
  }
);
