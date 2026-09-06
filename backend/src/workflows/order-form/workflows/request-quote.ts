import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateCartSubmitMetadataStep } from "../steps/update-cart-submit-metadata";
import { resolveApprovalContextStep } from "../steps/resolve-approval-context";
import { sendOperatorNotificationStep } from "../steps/send-operator-notification";
import { sendQuoteClientEmailStep } from "../../quote/steps/send-quote-client-email";
import { createRequestForQuoteWorkflow } from "../../quote/workflows/create-request-for-quote";
import { createApprovalsWorkflow } from "../../approval/workflows/create-approvals";
import { ApprovalType } from "../../../modules/approval/types";

/*
  Submit a Quote Request (CONTEXT.md): stamp the cart, then either

  - HELD: the submitter is a member of a Company whose Approval Setting
    is on -> create a pending Approval bound to the cart. No quote or
    draft order exists until an admin approves.
  - PASSTHROUGH: create the Quote + draft order (pending_merchant) so
    Cardinal sees it in admin immediately, and send the best-effort
    operator + customer emails.
*/

export type RequestQuoteWorkflowInput = {
  cart_id: string;
  customer_id: string;
  po_number?: string;
  attn_to?: string;
  notes?: string;
  po_file_url?: string;
  company_id?: string;
};

export type RequestQuoteWorkflowOutput = {
  quote_id: string | null;
  approval_id: string | null;
  pending_approval: boolean;
};

export const requestQuoteWorkflow = createWorkflow<
  RequestQuoteWorkflowInput,
  RequestQuoteWorkflowOutput,
  []
>("request-quote", function (input: RequestQuoteWorkflowInput) {
  updateCartSubmitMetadataStep({
    cart_id: input.cart_id,
    request_type: "quote" as const,
    po_number: input.po_number,
    attn_to: input.attn_to,
    notes: input.notes,
    po_file_url: input.po_file_url,
    company_id: input.company_id,
  }).config({ name: "update-cart-submit-metadata-quote" });

  const approvalContext = resolveApprovalContextStep({
    customer_id: input.customer_id,
  });

  const heldApproval = when(
    "quote-requires-approval",
    { approvalContext },
    ({ approvalContext }) => approvalContext.requires_approval
  ).then(() =>
    createApprovalsWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        type: ApprovalType.ADMIN,
        created_by: input.customer_id,
      },
    })
  );

  const passthroughQuote = when(
    "quote-passthrough",
    { approvalContext },
    ({ approvalContext }) => !approvalContext.requires_approval
  ).then(() => {
    const result = createRequestForQuoteWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        customer_id: input.customer_id,
      },
    });
    sendOperatorNotificationStep({
      cart_id: input.cart_id,
      customer_id: input.customer_id,
      request_type: "quote" as const,
      admin_target_id: result.quote.id,
    }).config({ name: "send-operator-notification-quote-passthrough" });
    // Held submissions skip this — the submitter gets the
    // approval-lifecycle emails instead.
    sendQuoteClientEmailStep({
      quote_id: result.quote.id,
      template: "quote-received" as const,
    }).config({ name: "send-quote-received-client-email" });
    return result;
  });

  return new WorkflowResponse(
    transform(
      { passthroughQuote, heldApproval, approvalContext },
      ({ passthroughQuote, heldApproval, approvalContext }) => ({
        // Exactly one branch is populated; the other returned undefined.
        quote_id: passthroughQuote?.quote?.id ?? null,
        approval_id: (heldApproval as any)?.[0]?.id ?? null,
        pending_approval: approvalContext.requires_approval,
      })
    )
  );
});
