import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { setInvoicePaymentStep } from "./steps/set-invoice-payment";

export type SetInvoicePaymentInput = { company_id: string; enabled: boolean };

/* Cardinal decides whether this Company may pay by invoice (see
   utils/payment-rules — ON bypasses the weight/total rules). */
export const setInvoicePaymentWorkflow = createWorkflow<
  SetInvoicePaymentInput,
  { id: string },
  []
>("set-invoice-payment", function (input) {
  const company = setInvoicePaymentStep(input);
  return new WorkflowResponse(company);
});
