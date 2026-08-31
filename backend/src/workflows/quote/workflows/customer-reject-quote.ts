import { useRemoteQueryStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { sendOperatorNotificationStep } from "../../order-form/steps/send-operator-notification";
import { validateQuoteOwnershipStep } from "../steps/validate-quote-ownership";
import { updateQuotesWorkflow } from "./update-quote";

/*
  Customer rejects a Quote. The decision then turns to Cardinal to make
  further adjustments, or let it remain rejected. Notifies the operator
  inbox so a rejection is never silent. Best-effort send.
*/
export const customerRejectQuoteWorkflow = createWorkflow<
  { quote_id: string; customer_id: string },
  void,
  []
>(
  "customer-reject-quote-workflow",
  function (input: { quote_id: string; customer_id: string }) {
    const quote = useRemoteQueryStep({
      entry_point: "quote",
      fields: ["id", "cart_id", "customer_id"],
      variables: { id: input.quote_id },
      list: false,
      throw_if_key_not_found: true,
    });

    // Ownership gate: without it reject is callable on any quote by any
    // authenticated customer — see validate-quote-ownership.
    validateQuoteOwnershipStep({ quote, customer_id: input.customer_id });

    updateQuotesWorkflow.runAsStep({
      input: [
        {
          id: input.quote_id,
          status: "customer_rejected" as const,
        },
      ],
    });

    sendOperatorNotificationStep({
      cart_id: quote.cart_id,
      customer_id: quote.customer_id,
      request_type: "quote-rejected" as const,
      admin_target_id: input.quote_id,
    }).config({ name: "send-operator-notification-quote-rejected" });

    return new WorkflowResponse(void 0);
  }
);
