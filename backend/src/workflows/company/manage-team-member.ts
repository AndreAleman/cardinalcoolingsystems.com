import type { TeamMemberRole } from "../../modules/company/types/role";
import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { updateTeamMemberStep } from "./steps/update-team-member";
import { removeTeamMemberStep } from "./steps/remove-team-member";

export type UpdateTeamMemberInput = {
  company_id: string;
  employee_id: string;
  role?: TeamMemberRole;
  spending_limit?: number;
};

export const updateTeamMemberWorkflow = createWorkflow<UpdateTeamMemberInput, { id: string }, []>(
  "update-team-member",
  function (input) {
    const employee = updateTeamMemberStep(input);
    return new WorkflowResponse(employee);
  }
);

export const removeTeamMemberWorkflow = createWorkflow<
  { company_id: string; employee_id: string },
  boolean,
  []
>("remove-team-member", function (input) {
  const done = removeTeamMemberStep(input);
  return new WorkflowResponse(done);
});
