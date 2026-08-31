import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { setOrderDepositStatusStep } from "./steps/set-order-deposit-status";

/* The manual Stripe-invoice flow for deposit_50 orders: "due" at
   promotion, then admin marks each stage from the order page. */
export type DepositStatus = "deposit_invoiced" | "balance_invoiced" | "paid";

export type UpdateDepositStatusInput = {
  order_id: string;
  status: DepositStatus;
};

export const updateDepositStatusWorkflow = createWorkflow<
  UpdateDepositStatusInput,
  { order_id: string; deposit_status: DepositStatus },
  []
>("update-order-deposit-status", function (input) {
  const result = setOrderDepositStatusStep(input);
  return new WorkflowResponse(result);
});
