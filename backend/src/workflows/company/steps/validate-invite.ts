import type { TeamMemberRole } from "../../../modules/company/types/role";
import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import { resolveCompanyContext } from "../../../utils/company-context";
import { inviteProblem } from "../../../utils/invite-validity";

const MESSAGES = {
  not_found: "This invite link is not valid",
  expired: "This invite link has expired — ask your coworker to send a new one",
  already_accepted: "This invite has already been used",
  wrong_email: "This invite was sent to a different email address",
};

/* The Invite is open, unexpired, for this customer, who has no Company yet. */
export const validateInviteStep = createStep(
  "validate-invite",
  async (input: { token: string; customer: { id: string; email: string } }, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const [invite] = await companyService.listCompanyInvites({ token: input.token });
    const problem = inviteProblem(invite, input.customer.email, new Date());
    if (problem === "not_found") {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, MESSAGES.not_found);
    }
    if (problem) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, MESSAGES[problem]);
    }
    if (await resolveCompanyContext(container, input.customer.id)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "You are already a Team Member of a Company"
      );
    }
    return new StepResponse({
      id: invite.id,
      company_id: invite.company_id,
      role: invite.role as TeamMemberRole,
    });
  }
);
