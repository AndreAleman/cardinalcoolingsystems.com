import { useQueryGraphStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { validateDepositEligibilityStep } from "../steps/validate-deposit-eligibility";
import { updateCartSubmitMetadataStep } from "../steps/update-cart-submit-metadata";
import { resolveApprovalContextStep } from "../steps/resolve-approval-context";
import { sendOperatorNotificationStep } from "../steps/send-operator-notification";
import { stampOrderDepositMetadataStep } from "../steps/stamp-order-deposit-metadata";
import { createRequestForQuoteWorkflow } from "../../quote/workflows/create-request-for-quote";
import { merchantSendQuoteWorkflow } from "../../quote/workflows/merchant-send-quote";
import { customerAcceptQuoteWorkflow } from "../../quote/workflows/customer-accept-quote";
import { createApprovalsWorkflow } from "../../approval/workflows/create-approvals";
import { ApprovalType } from "../../../modules/approval/types";

/*
  Place a 50%-deposit order: over 120 lbs at $7,500+ freight is free, so
  the order is taken WITHOUT payment and marked deposit-due. Cardinal
  sends the Stripe deposit invoice from admin, then the balance invoice
  (net 30) after arrival. Same pipeline as invoice orders plus the
  eligibility check and the deposit metadata stamp.
*/

export type PlaceDepositOrderWorkflowInput = {
  cart_id: string;
  customer_id: string;
  po_number: string;
  attn_to?: string;
  notes?: string;
  company_id: string;
};

export type PlaceDepositOrderWorkflowOutput = {
  quote_id: string | null;
  order_id: string | null;
  approval_id: string | null;
  pending_approval: boolean;
};

export const placeDepositOrderWorkflow = createWorkflow<
  PlaceDepositOrderWorkflowInput,
  PlaceDepositOrderWorkflowOutput,
  []
>("place-deposit-order", function (input: PlaceDepositOrderWorkflowInput) {
  validateDepositEligibilityStep({
    cart_id: input.cart_id,
    company_id: input.company_id,
  });

  updateCartSubmitMetadataStep({
    cart_id: input.cart_id,
    request_type: "order" as const,
    po_number: input.po_number,
    attn_to: input.attn_to,
    notes: input.notes,
    company_id: input.company_id,
  }).config({ name: "update-cart-submit-metadata-deposit" });

  const approvalContext = resolveApprovalContextStep({
    customer_id: input.customer_id,
  });

  const heldApproval = when(
    "deposit-requires-approval",
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

  const passthrough = when(
    "deposit-passthrough",
    { approvalContext },
    ({ approvalContext }) => !approvalContext.requires_approval
  ).then(() => {
    const { quote } = createRequestForQuoteWorkflow.runAsStep({
      input: {
        cart_id: input.cart_id,
        customer_id: input.customer_id,
      },
    });
    merchantSendQuoteWorkflow.runAsStep({
      input: { quote_id: quote.id },
    });
    customerAcceptQuoteWorkflow.runAsStep({
      input: {
        quote_id: quote.id,
        customer_id: input.customer_id,
        po_number: input.po_number,
        notify_operator: false,
      },
    });
    const { data: refreshed } = useQueryGraphStep({
      entity: "quote",
      fields: ["id", "draft_order_id", "status"],
      filters: { id: quote.id },
    }).config({ name: "fetch-quote-after-deposit-accept" });

    stampOrderDepositMetadataStep({
      order_id: transform(
        { refreshed },
        ({ refreshed }) => (refreshed?.[0] as any)?.draft_order_id
      ),
    });

    sendOperatorNotificationStep({
      cart_id: input.cart_id,
      customer_id: input.customer_id,
      request_type: "order" as const,
      admin_target_id: transform(
        { refreshed },
        ({ refreshed }) => (refreshed?.[0] as any)?.draft_order_id ?? null
      ),
    }).config({ name: "send-operator-notification-deposit-passthrough" });
    return { refreshed };
  });

  return new WorkflowResponse(
    transform(
      { passthrough, heldApproval, approvalContext },
      ({ passthrough, heldApproval, approvalContext }) => ({
        quote_id: passthrough?.refreshed?.[0]?.id ?? null,
        order_id:
          (passthrough?.refreshed?.[0] as any)?.draft_order_id ?? null,
        approval_id: (heldApproval as any)?.[0]?.id ?? null,
        pending_approval: approvalContext.requires_approval,
      })
    )
  );
});
