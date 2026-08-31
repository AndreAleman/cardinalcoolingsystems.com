import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { findOrCreateGuestCustomerStep } from "../steps/find-or-create-guest-customer";
import { attachCartCustomerStep } from "../steps/attach-cart-customer";
import { updateCartSubmitMetadataStep } from "../steps/update-cart-submit-metadata";
import { sendOperatorNotificationStep } from "../steps/send-operator-notification";
import { sendQuoteClientEmailStep } from "../../quote/steps/send-quote-client-email";
import { createRequestForQuoteWorkflow } from "../../quote/workflows/create-request-for-quote";

/*
  Guest quote: a visitor with no account submits the public cart as a
  Quote Request with their name, email, and company typed in. Lands in
  the same admin queue as portal quotes. No approval gate (no Company
  entity), no company link. Replaces the legacy flow that logged in
  with admin credentials from the storefront.
*/

export type GuestQuoteWorkflowInput = {
  cart_id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  phone?: string;
  po_number?: string;
  notes?: string;
};

export type GuestQuoteWorkflowOutput = {
  quote_id: string;
};

export const guestQuoteWorkflow = createWorkflow<
  GuestQuoteWorkflowInput,
  GuestQuoteWorkflowOutput,
  []
>("guest-quote", function (input: GuestQuoteWorkflowInput) {
  const guest = findOrCreateGuestCustomerStep({
    email: input.email,
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone,
    company_name: input.company_name,
  });

  attachCartCustomerStep({
    cart_id: input.cart_id,
    customer_id: guest.customer_id,
    email: guest.email,
  });

  updateCartSubmitMetadataStep({
    cart_id: input.cart_id,
    request_type: "quote" as const,
    po_number: input.po_number,
    notes: input.notes,
    guest_company_name: input.company_name,
    guest_phone: input.phone,
  }).config({ name: "update-cart-submit-metadata-guest-quote" });

  const result = createRequestForQuoteWorkflow.runAsStep({
    input: {
      cart_id: input.cart_id,
      customer_id: guest.customer_id,
    },
  });

  sendOperatorNotificationStep({
    cart_id: input.cart_id,
    customer_id: guest.customer_id,
    request_type: "quote" as const,
    admin_target_id: result.quote.id,
  }).config({ name: "send-operator-notification-guest-quote" });

  sendQuoteClientEmailStep({
    quote_id: result.quote.id,
    template: "quote-received" as const,
  }).config({ name: "send-quote-received-guest-email" });

  return new WorkflowResponse(
    transform({ result }, ({ result }) => ({ quote_id: result.quote.id }))
  );
});
