import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { guestQuoteWorkflow } from "../../../../workflows/order-form/workflows/guest-quote";
import type { GuestQuoteType } from "../validators";

/*
  POST /store/order-form/guest-quote

  Public (publishable key only): a visitor submits the cart as a Quote
  Request with typed-in contact details. Cardinal answers by email.
*/
export const POST = async (
  req: MedusaRequest<GuestQuoteType>,
  res: MedusaResponse
) => {
  const { cart_id, email, first_name, last_name, company_name, phone, po_number, notes } =
    req.validatedBody;

  const { result } = await guestQuoteWorkflow(req.scope).run({
    input: { cart_id, email, first_name, last_name, company_name, phone, po_number, notes },
  });

  return res.json({ quote_id: result.quote_id });
};
