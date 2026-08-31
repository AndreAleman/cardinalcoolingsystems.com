import { model } from "@medusajs/framework/utils";

/* Per-Company Approval Setting: "orders from members need admin approval".
   Every Company gets one row at creation, switched off — the feature is
   inert while every Team Member is an admin. */
export const ApprovalSettings = model.define("approval_settings", {
  id: model.id({ prefix: "apprset" }).primaryKey(),
  company_id: model.text(),
  requires_admin_approval: model.boolean().default(false),
});
