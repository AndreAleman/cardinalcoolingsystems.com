import { useRemoteQueryStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  ModuleCreateQuoteMessage,
  ModuleQuoteMessage,
} from "../../../modules/quote/types";
import { sendOperatorNotificationStep } from "../../order-form/steps/send-operator-notification";
import { createQuoteMessageStep } from "../steps/create-quote-message";

/*
  Create a Quote Message — the communication trail between Cardinal and
  the customer. The message can also hold an item_id for either actor to
  negotiate a specific line.

  When the message is CUSTOMER-authored (customer_id set — change
  requests, negotiation notes), the operator inbox gets a "customer
  replied on a quote" email carrying the message text. Admin-authored
  messages don't email anyone here — the customer hears about revisions
  via quote-ready when Cardinal re-sends.
*/
export const createQuoteMessageWorkflow = createWorkflow<
  ModuleCreateQuoteMessage,
  ModuleQuoteMessage,
  []
>("create-quote-message-workflow", function (input: ModuleCreateQuoteMessage) {
  const message = createQuoteMessageStep(input);

  when(
    "quote-message-from-customer",
    { input },
    ({ input: i }) => Boolean(i.customer_id)
  ).then(() => {
    const quote = useRemoteQueryStep({
      entry_point: "quote",
      fields: ["id", "cart_id", "customer_id"],
      variables: { id: input.quote_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "load-quote-for-message-notification" });

    sendOperatorNotificationStep({
      cart_id: quote.cart_id,
      customer_id: quote.customer_id,
      request_type: "quote-message" as const,
      admin_target_id: input.quote_id,
      message_text: input.text,
    }).config({ name: "send-operator-notification-quote-message" });
  });

  return new WorkflowResponse(message);
});
