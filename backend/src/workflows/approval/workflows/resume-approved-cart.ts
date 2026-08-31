import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { lookupCartForResumeStep } from "../steps/lookup-cart-for-resume";
import { createRequestForQuoteWorkflow } from "../../quote/workflows/create-request-for-quote";
import { merchantSendQuoteWorkflow } from "../../quote/workflows/merchant-send-quote";
import { customerAcceptQuoteWorkflow } from "../../quote/workflows/customer-accept-quote";

/*
  Resume a held cart after its Approval flips to APPROVED. The cart
  already carries all line items + submit metadata from the original
  order-form submission; we just run the downstream pipeline the hold
  stopped:

    request_type=quote → createRequestForQuoteWorkflow (Quote sits in
      pending_merchant for Cardinal's review — same as a direct submit
      from a manager/admin)
    request_type=order → full Pay-via-Invoice pipeline:
      createRequestForQuote → merchantSendQuote → customerAcceptQuote
      (promotes the draft Order to PENDING, carrying the cart's
      po_number)

  Idempotency: skipped entirely when a Quote already exists for the
  cart (lookup step's already_resumed).
*/

export type ResumeApprovedCartWorkflowInput = {
  cart_id: string;
  customer_id: string;
};

export type ResumeApprovedCartWorkflowOutput = {
  resumed: boolean;
  request_type: "quote" | "order" | null;
};

export const resumeApprovedCartWorkflow = createWorkflow<
  ResumeApprovedCartWorkflowInput,
  ResumeApprovedCartWorkflowOutput,
  []
>("resume-approved-cart", function (input: ResumeApprovedCartWorkflowInput) {
  const cartInfo = lookupCartForResumeStep({ cart_id: input.cart_id });

  // Each .runAsStep() needs a unique .config({name}) — Medusa derives
  // step names from the inner workflow's name and complains about
  // duplicates within a single workflow body. Both branches below call
  // createRequestForQuoteWorkflow.runAsStep, so all are explicitly named.
  when(
    "resume-is-quote",
    { cartInfo },
    ({ cartInfo }) =>
      cartInfo.request_type === "quote" && !cartInfo.already_resumed
  ).then(() => {
    createRequestForQuoteWorkflow
      .runAsStep({
        input: {
          cart_id: input.cart_id,
          customer_id: input.customer_id,
        },
      })
      .config({ name: "create-request-for-quote-resume-quote" });
  });

  when(
    "resume-is-order",
    { cartInfo },
    ({ cartInfo }) =>
      cartInfo.request_type === "order" && !cartInfo.already_resumed
  ).then(() => {
    const { quote } = createRequestForQuoteWorkflow
      .runAsStep({
        input: {
          cart_id: input.cart_id,
          customer_id: input.customer_id,
        },
      })
      .config({ name: "create-request-for-quote-resume-order" });
    merchantSendQuoteWorkflow
      .runAsStep({
        input: { quote_id: quote.id },
      })
      .config({ name: "merchant-send-quote-resume" });
    customerAcceptQuoteWorkflow
      .runAsStep({
        input: transform(
          { quote, cartInfo, input },
          ({ quote, cartInfo, input }) => ({
            quote_id: quote.id,
            customer_id: input.customer_id,
            po_number: cartInfo.po_number ?? undefined,
            // The approval-decided email is a later slice; either way,
            // no acceptance emails should fire on a resume.
            notify_operator: false,
          })
        ),
      })
      .config({ name: "customer-accept-quote-resume" });
  });

  return new WorkflowResponse(
    transform({ cartInfo }, ({ cartInfo }) => ({
      resumed: !cartInfo.already_resumed,
      request_type: cartInfo.request_type,
    }))
  );
});
