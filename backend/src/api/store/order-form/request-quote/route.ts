import type { MedusaResponse } from "@medusajs/framework";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { requestQuoteWorkflow } from "../../../../workflows/order-form/workflows/request-quote";
import type { RequestQuoteType } from "../validators";

/*
  POST /store/order-form/request-quote

  Submit the Team Member's cart as a Quote Request. Behind dashboardGate:
  the Company is resolved from the auth token (ADR-0004) and must be
  approved. Returns either a quote_id (passthrough) or an approval_id
  (held for admin approval).
*/
export const POST = async (
  req: CompanyRequest & { validatedBody: RequestQuoteType },
  res: MedusaResponse
) => {
  const customer_id = req.auth_context.actor_id;
  const { cart_id, po_number, attn_to, notes, po_file_url, location_id } =
    req.validatedBody;

  const { result } = await requestQuoteWorkflow(req.scope).run({
    input: {
      cart_id,
      customer_id,
      po_number,
      attn_to,
      notes,
      po_file_url,
      location_id,
      company_id: req.company_context.companyId,
    },
  });

  return res.json({
    quote_id: result.quote_id,
    approval_id: result.approval_id,
    pending_approval: result.pending_approval,
  });
};
