import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../modules/company";
import { validateInviteStep } from "./steps/validate-invite";
import { createTeamMemberStep } from "./steps/create-team-member";
import { joinCompanyCustomerGroupStep } from "./steps/join-company-customer-group";
import { markInviteAcceptedStep } from "./steps/mark-invite-accepted";

export type AcceptInviteInput = {
  token: string;
  customer: { id: string; email: string };
};

export type AcceptInviteOutput = { company_id: string; role: string };

/* The invited customer becomes a Team Member of the inviter's Company. */
export const acceptInviteWorkflow = createWorkflow<AcceptInviteInput, AcceptInviteOutput, []>(
  "accept-invite",
  function (input) {
    const invite = validateInviteStep(input);
    const teamMember = createTeamMemberStep({ company_id: invite.company_id, role: invite.role });

    const links = transform({ teamMember, input }, (d) => [
      {
        [COMPANY_MODULE]: { employee_id: d.teamMember.id },
        [Modules.CUSTOMER]: { customer_id: d.input.customer.id },
      },
    ]);
    createRemoteLinkStep(links);

    joinCompanyCustomerGroupStep({ company_id: invite.company_id, customer_id: input.customer.id });
    markInviteAcceptedStep({ invite_id: invite.id });

    return new WorkflowResponse({ company_id: invite.company_id, role: invite.role });
  }
);
