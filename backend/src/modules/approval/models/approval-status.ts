import { model } from "@medusajs/framework/utils";
import { ApprovalStatusType } from "../types";

/* One denormalized row per cart: what the cart-mutation hooks read to
   decide whether a cart is frozen while an Approval is pending. */
export const ApprovalStatus = model.define("approval_status", {
  id: model.id({ prefix: "apprstat" }).primaryKey(),
  cart_id: model.text(),
  status: model.enum(ApprovalStatusType).default(ApprovalStatusType.PENDING),
});
