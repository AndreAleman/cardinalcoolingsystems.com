import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import { APPROVAL_MODULE } from "../../../modules/approval";
import { COMPANY_MODULE } from "../../../modules/company";
import {
  createApprovalSettingsStep,
  CreateApprovalSettingsInput,
} from "../steps/create-approval-settings";

/*
  Create a Company's Approval Setting row and link it to the Company so
  it is reachable as company.approval_settings.
*/
export const createApprovalSettingsWorkflow = createWorkflow<
  CreateApprovalSettingsInput | CreateApprovalSettingsInput[],
  { id: string; company_id: string; requires_admin_approval: boolean }[],
  []
>("create-approval-settings", function (input) {
  const settingsInput = transform(input, (input) =>
    Array.isArray(input) ? input : [input]
  );

  const approvalSettings = createApprovalSettingsStep(settingsInput);

  const linkData = transform(approvalSettings, (settings) =>
    settings.map((setting) => ({
      [COMPANY_MODULE]: { company_id: setting.company_id },
      [APPROVAL_MODULE]: { approval_settings_id: setting.id },
    }))
  );

  createRemoteLinkStep(linkData);

  return new WorkflowResponse(approvalSettings);
});
