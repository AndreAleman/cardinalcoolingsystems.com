import type { MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { createApprovalSettingsWorkflow } from "../../../../workflows/approval/workflows/create-approval-settings";
import { updateApprovalSettingsWorkflow } from "../../../../workflows/approval/workflows/update-approval-settings";
import type { StoreUpdateApprovalSettingsType } from "../../approvals/validators";

/*
  The Company's Approval Setting on the Dashboard (CONTEXT.md):
  - GET: any Team Member can read it; no row yet means OFF (Companies
    opt in).
  - POST: admin-only (ensureEmployeeRole("admin") in the middleware);
    upserts the row for the auth-resolved Company.
*/

export const GET = async (req: CompanyRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [settings],
  } = await query.graph({
    entity: "approval_settings",
    fields: ["id", "requires_admin_approval"],
    filters: { company_id: req.company_context.companyId } as any,
  });

  res.json({
    approval_settings: {
      requires_admin_approval: Boolean(
        (settings as any)?.requires_admin_approval
      ),
    },
  });
};

export const POST = async (
  req: CompanyRequest & { validatedBody: StoreUpdateApprovalSettingsType },
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { companyId } = req.company_context;
  const { requires_admin_approval } = req.validatedBody;

  const {
    data: [existing],
  } = await query.graph({
    entity: "approval_settings",
    fields: ["id"],
    filters: { company_id: companyId } as any,
  });

  if (existing) {
    await updateApprovalSettingsWorkflow(req.scope).run({
      input: { id: (existing as any).id, requires_admin_approval },
    });
  } else {
    await createApprovalSettingsWorkflow(req.scope).run({
      input: { company_id: companyId, requires_admin_approval },
    });
  }

  res.json({ approval_settings: { requires_admin_approval } });
};
