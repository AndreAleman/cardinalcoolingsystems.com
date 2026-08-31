import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { createInviteStep } from "./steps/create-invite";
import { notifyInviteStep } from "./steps/notify-invite";

export type InviteTeamMemberInput = {
  company: { id: string; name: string };
  email: string;
  inviter: { id: string; name: string };
};

export type InviteTeamMemberOutput = {
  id: string;
  email: string;
  token: string;
  expires_at: string;
};

export const inviteTeamMemberWorkflow = createWorkflow<
  InviteTeamMemberInput,
  InviteTeamMemberOutput,
  []
>("invite-team-member", function (input) {
  const invite = createInviteStep({
    company_id: input.company.id,
    email: input.email,
    invited_by: input.inviter.id,
  });
  notifyInviteStep({
    email: invite.email,
    token: invite.token,
    company_name: input.company.name,
    inviter_name: input.inviter.name,
    expires_at: invite.expires_at,
  });
  return new WorkflowResponse(invite);
});
