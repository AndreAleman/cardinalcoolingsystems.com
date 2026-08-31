import { randomBytes } from "crypto";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import { inviteExpiry } from "../../../utils/invite-validity";

type Input = { company_id: string; email: string; invited_by: string };

/* One open Invite per email per Company: re-inviting refreshes the token. */
export const createInviteStep = createStep(
  "create-invite",
  async (input: Input, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const email = input.email.trim().toLowerCase();
    const token = randomBytes(24).toString("base64url");
    const expires_at = inviteExpiry(new Date());

    const [existing] = await companyService.listCompanyInvites({
      company_id: input.company_id,
      email,
      accepted_at: null,
    });
    const invite = existing
      ? await companyService.updateCompanyInvites({ id: existing.id, token, expires_at, invited_by: input.invited_by })
      : await companyService.createCompanyInvites({
          company_id: input.company_id,
          email,
          token,
          expires_at,
          invited_by: input.invited_by,
          role: "admin",
        });

    // Only serializable fields cross the step boundary.
    return new StepResponse(
      { id: invite.id, email: invite.email, token: invite.token, expires_at: new Date(invite.expires_at).toISOString() },
      existing ? null : invite.id
    );
  },
  async (createdId, { container }) => {
    if (!createdId) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.deleteCompanyInvites(createdId);
  }
);
