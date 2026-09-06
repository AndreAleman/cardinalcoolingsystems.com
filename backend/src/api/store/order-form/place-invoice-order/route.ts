import type { MedusaResponse } from "@medusajs/framework";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { placeInvoiceOrderWorkflow } from "../../../../workflows/order-form/workflows/place-invoice-order";
import type { PlaceInvoiceOrderType } from "../validators";

/*
  POST /store/order-form/place-invoice-order

  Invoice-enabled Companies only (ensureInvoicePaymentEnabled). The cart
  becomes a real PENDING Order with no payment; Cardinal bills offline.
*/
export const POST = async (
  req: CompanyRequest & { validatedBody: PlaceInvoiceOrderType },
  res: MedusaResponse
) => {
  const customer_id = req.auth_context.actor_id;
  const { cart_id, po_number, attn_to, notes, po_file_url } = req.validatedBody;

  const { result } = await placeInvoiceOrderWorkflow(req.scope).run({
    input: {
      cart_id,
      customer_id,
      po_number,
      attn_to,
      notes,
      po_file_url,
      company_id: req.company_context.companyId,
    },
  });

  return res.json({
    quote_id: result.quote_id,
    order_id: result.order_id,
    approval_id: result.approval_id,
    pending_approval: result.pending_approval,
  });
};
