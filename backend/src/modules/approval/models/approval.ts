import { model } from "@medusajs/framework/utils";
import { ApprovalStatusType, ApprovalType } from "../types";

export const Approval = model.define("approval", {
  id: model.id({ prefix: "appr" }).primaryKey(),
  cart_id: model.text(),
  type: model.enum(ApprovalType),
  // Default required: without it, creates that omit status write NULL and
  // every status read misfires (bug hit in the reference implementation).
  status: model.enum(ApprovalStatusType).default(ApprovalStatusType.PENDING),
  created_by: model.text(),
  handled_by: model.text().nullable(),
});
