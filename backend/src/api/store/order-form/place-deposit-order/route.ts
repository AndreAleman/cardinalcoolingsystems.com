import type { MedusaResponse } from "@medusajs/framework";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { placeDepositOrderWorkflow } from "../../../../workflows/order-form/workflows/place-deposit-order";
import type { PlaceDepositOrderType } from "../validators";

/*
  POST /store/order-form/place-deposit-order

  Heavy $7,500+ orders: taken unpaid, marked "50% deposit due". The
  workflow re-verifies eligibility server-side.
*/
export const POST = async (
  req: CompanyRequest & { validatedBody: PlaceDepositOrderType },
  res: MedusaResponse
) => {
  const customer_id = req.auth_context.actor_id;
  const { cart_id, po_number, attn_to, notes, po_file_url } = req.validatedBody;

  const { result } = await placeDepositOrderWorkflow(req.scope).run({
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
