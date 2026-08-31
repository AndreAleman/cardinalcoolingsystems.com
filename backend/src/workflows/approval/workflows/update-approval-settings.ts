import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  updateApprovalSettingsStep,
  UpdateApprovalSettingsInput,
} from "../steps/update-approval-settings";

/* Flip an existing Approval Setting row (dashboard toggle). */
export const updateApprovalSettingsWorkflow = createWorkflow<
  UpdateApprovalSettingsInput,
  { id: string; company_id: string; requires_admin_approval: boolean },
  []
>("update-approval-settings", function (input: UpdateApprovalSettingsInput) {
  return new WorkflowResponse(updateApprovalSettingsStep(input));
});
