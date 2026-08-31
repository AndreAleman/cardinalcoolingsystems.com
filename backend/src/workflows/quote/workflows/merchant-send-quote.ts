import { useRemoteQueryStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { sendQuoteClientEmailStep } from "../steps/send-quote-client-email";
import { updateQuotesWorkflow } from "./update-quote";

/*
  Send a Quote to the customer: pending_merchant -> pending_customer.

  Cardinal prices lines through the draft order's order-edit before
  sending. Fires the quote-ready email to the customer on every send —
  first send and revised re-sends alike. Best-effort; a failed email
  never rolls back the status flip.
*/
export const merchantSendQuoteWorkflow = createWorkflow<
  { quote_id: string },
  void,
  []
>("merchant-send-quote-workflow", function (input: { quote_id: string }) {
  useRemoteQueryStep({
    entry_point: "quote",
    fields: ["id"],
    variables: { id: input.quote_id },
    list: false,
    throw_if_key_not_found: true,
  });

  updateQuotesWorkflow.runAsStep({
    input: [
      {
        id: input.quote_id,
        status: "pending_customer" as const,
      },
    ],
  });

  sendQuoteClientEmailStep({
    quote_id: input.quote_id,
    template: "quote-ready" as const,
  }).config({ name: "send-quote-ready-client-email" });

  return new WorkflowResponse(void 0);
});
