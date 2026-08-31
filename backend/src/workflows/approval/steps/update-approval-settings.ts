import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { APPROVAL_MODULE } from "../../../modules/approval";
import type ApprovalModuleService from "../../../modules/approval/service";

export type UpdateApprovalSettingsInput = {
  id: string;
  requires_admin_approval: boolean;
};

/* Flip a Company's Approval Setting; compensation restores the old value. */
export const updateApprovalSettingsStep = createStep(
  "update-approval-settings",
  async (input: UpdateApprovalSettingsInput, { container }) => {
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);

    const previous = await approvalModule.retrieveApprovalSettings(input.id);

    const [updated] = await approvalModule.updateApprovalSettings([input]);

    return new StepResponse(updated, {
      id: previous.id,
      requires_admin_approval: previous.requires_admin_approval,
    });
  },
  async (previousData, { container }) => {
    if (!previousData) return;
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);
    await approvalModule.updateApprovalSettings([previousData]);
  }
);
