import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

/*
  Patch cart.metadata with order-form submit fields. Backs both paths:
  - Quote Request: request_type=quote, po_number optional
  - Invoice Order: request_type=order, po_number required upstream

  The company_id is stamped server-side from the auth-resolved Company
  context (ADR-0004) so downstream consumers (emails, admin, resume flow)
  never join back through the employee link.

  Compensation restores the previous metadata.
*/

type Input = {
  cart_id: string;
  request_type: "order" | "quote";
  po_number?: string;
  attn_to?: string;
  notes?: string;
  company_id?: string;
  /** Guest quotes: free-typed company name + phone (no Company entity). */
  guest_company_name?: string;
  guest_phone?: string;
};

type CompensationData = {
  cart_id: string;
  previousMetadata: Record<string, unknown>;
};

export const updateCartSubmitMetadataStep = createStep(
  "update-cart-submit-metadata",
  async (
    {
      cart_id,
      request_type,
      po_number,
      attn_to,
      notes,
      company_id,
      guest_company_name,
      guest_phone,
    }: Input,
    { container }
  ) => {
    const cartModule = container.resolve(Modules.CART);

    const [existing] = await cartModule.listCarts({ id: cart_id });
    const previousMetadata = (existing?.metadata ?? {}) as Record<
      string,
      unknown
    >;

    const newMetadata: Record<string, unknown> = {
      ...previousMetadata,
      request_type,
    };
    if (po_number) newMetadata.po_number = po_number;
    if (attn_to && attn_to.trim().length > 0)
      newMetadata.attn_to = attn_to.trim();
    if (notes && notes.trim().length > 0) newMetadata.notes = notes.trim();
    if (company_id) newMetadata.company_id = company_id;
    if (guest_company_name && guest_company_name.trim().length > 0)
      newMetadata.guest_company_name = guest_company_name.trim();
    if (guest_phone && guest_phone.trim().length > 0)
      newMetadata.guest_phone = guest_phone.trim();

    await cartModule.updateCarts(cart_id, { metadata: newMetadata });

    return new StepResponse<{ cart_id: string }, CompensationData>(
      { cart_id },
      { cart_id, previousMetadata }
    );
  },
  async (compensationData, { container }) => {
    if (!compensationData) return;
    const { cart_id, previousMetadata } = compensationData;
    const cartModule = container.resolve(Modules.CART);
    await cartModule.updateCarts(cart_id, { metadata: previousMetadata });
  }
);
