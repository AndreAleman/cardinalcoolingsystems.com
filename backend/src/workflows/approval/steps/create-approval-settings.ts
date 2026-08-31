import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { APPROVAL_MODULE } from "../../../modules/approval";
import type ApprovalModuleService from "../../../modules/approval/service";

export type CreateApprovalSettingsInput = {
  company_id: string;
  requires_admin_approval?: boolean;
};

/* Create a Company's Approval Setting row (off unless told otherwise). */
export const createApprovalSettingsStep = createStep(
  "create-approval-settings",
  async (input: CreateApprovalSettingsInput[], { container }) => {
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);

    const approvalSettings = await approvalModule.createApprovalSettings(
      input.map((setting) => ({
        company_id: setting.company_id,
        requires_admin_approval: setting.requires_admin_approval ?? false,
      }))
    );

    const created = Array.isArray(approvalSettings)
      ? approvalSettings
      : [approvalSettings];

    return new StepResponse(
      created,
      created.map((setting: { id: string }) => setting.id)
    );
  },
  async (settingIds, { container }) => {
    if (!settingIds) return;
    const approvalModule =
      container.resolve<ApprovalModuleService>(APPROVAL_MODULE);
    await approvalModule.deleteApprovalSettings(settingIds);
  }
);
