import {
  confirmOrderEditRequestWorkflow,
  useRemoteQueryStep,
} from "@medusajs/medusa/core-flows";
import { OrderStatus } from "@medusajs/framework/utils";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateOrderWorkflow } from "../../order/workflows/update-order";
import { sendOperatorNotificationStep } from "../../order-form/steps/send-operator-notification";
import { sendQuoteAcceptedClientEmailStep } from "../steps/send-quote-accepted-client-email";
import { validateQuoteAcceptanceStep } from "../steps/validate-quote-acceptance";
import { validateQuoteOwnershipStep } from "../steps/validate-quote-ownership";
import { updateQuotesWorkflow } from "./update-quote";

export type CustomerAcceptQuoteWorkflowInput = {
  quote_id: string;
  customer_id: string;
  /**
   * Optional at the workflow signature level so future internal callers
   * which already have a PO on the cart's metadata don't need to thread
   * it through. The customer-accept route (POST /store/quotes/:id/accept)
   * requires it via the AcceptQuote zod validator.
   */
  po_number?: string;
  /**
   * When false, skips both acceptance emails — for internal callers
   * that send their own "new order" notification, so the operator never
   * gets two emails for one order. The customer-accept route omits it,
   * so a real quote acceptance still notifies.
   */
  notify_operator?: boolean;
};

/*
  Customer accepts a Quote: staged changes on the draft order are
  committed (order edit confirmed) and the draft is promoted to a
  PENDING order carrying the po_number on its metadata, so admin →
  Orders shows it without a join chain back to the cart.
*/
export const customerAcceptQuoteWorkflow = createWorkflow<
  CustomerAcceptQuoteWorkflowInput,
  void,
  []
>(
  "customer-accept-quote-workflow",
  function (input: CustomerAcceptQuoteWorkflowInput) {
    const quote = useRemoteQueryStep({
      entry_point: "quote",
      fields: ["id", "draft_order_id", "cart_id", "status", "customer_id"],
      variables: { id: input.quote_id },
      list: false,
      throw_if_key_not_found: true,
    });

    validateQuoteOwnershipStep({ quote, customer_id: input.customer_id });

    validateQuoteAcceptanceStep({ quote });

    updateQuotesWorkflow.runAsStep({
      input: [{ id: input.quote_id, status: "accepted" as const }],
    });

    confirmOrderEditRequestWorkflow.runAsStep({
      input: {
        order_id: quote.draft_order_id,
        confirmed_by: input.customer_id,
      },
    });

    // Promote draft -> PENDING order. When po_number is supplied, stamp
    // it onto order.metadata (merged, never replaced — see the step).
    updateOrderWorkflow.runAsStep({
      input: transform({ quote, input }, ({ quote: q, input: i }) => {
        const base: any = {
          id: q.draft_order_id as string,
          is_draft_order: false,
          status: OrderStatus.PENDING,
        };
        if (i.po_number) {
          base.metadata = { po_number: i.po_number };
        }
        return base;
      }),
    });

    // Notify Cardinal that a quote was accepted -> new order ready.
    // Best-effort send — failure logs without rolling back the just-
    // promoted order.
    when(
      "quote-accepted-should-notify",
      { input },
      ({ input: i }) => i.notify_operator !== false
    ).then(() => {
      sendOperatorNotificationStep({
        cart_id: quote.cart_id,
        customer_id: input.customer_id,
        request_type: "quote-accepted" as const,
        admin_target_id: quote.draft_order_id,
      }).config({
        name: "send-operator-notification-quote-accepted",
      });
    });

    // Order confirmation to the CUSTOMER. Gated on the same flag as the
    // operator email: an internal caller isn't a real quote acceptance,
    // so a "thanks for accepting your quote" email would be wrong there
    // too. Best-effort like every email step.
    when(
      "quote-accepted-should-email-client",
      { input },
      ({ input: i }) => i.notify_operator !== false
    ).then(() => {
      sendQuoteAcceptedClientEmailStep({
        order_id: quote.draft_order_id,
        po_number: input.po_number,
      }).config({
        name: "send-quote-accepted-client-email",
      });
    });

    return new WorkflowResponse(void 0);
  }
);
