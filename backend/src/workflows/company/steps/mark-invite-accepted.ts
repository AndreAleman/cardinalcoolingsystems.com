import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

export const markInviteAcceptedStep = createStep(
  "mark-invite-accepted",
  async (input: { invite_id: string }, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.updateCompanyInvites({ id: input.invite_id, accepted_at: new Date() });
    return new StepResponse(true, input.invite_id);
  },
  async (inviteId, { container }) => {
    if (!inviteId) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.updateCompanyInvites({ id: inviteId, accepted_at: null });
  }
);
