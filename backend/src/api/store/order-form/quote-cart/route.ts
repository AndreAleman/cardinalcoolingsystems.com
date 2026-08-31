import type { MedusaResponse } from "@medusajs/framework";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { createQuoteCartWorkflow } from "../../../../workflows/order-form/workflows/create-quote-cart";
import type { QuoteCartType } from "../validators";

/*
  POST /store/order-form/quote-cart

  Build a cart from Quote-Only Lines (no price on file / over stock)
  that the standard cart flow would reject. Feeds request-quote.
*/
export const POST = async (
  req: CompanyRequest & { validatedBody: QuoteCartType },
  res: MedusaResponse
) => {
  const { region_id, items } = req.validatedBody;

  const { result } = await createQuoteCartWorkflow(req.scope).run({
    input: {
      region_id,
      customer_id: req.auth_context.actor_id,
      // zod's inference marks object fields optional pre-4.x; the
      // schema guarantees both are present.
      items: items as { variant_id: string; quantity: number }[],
    },
  });

  return res.json({ cart_id: result.cart_id });
};
