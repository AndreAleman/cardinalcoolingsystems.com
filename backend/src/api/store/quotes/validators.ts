import {
  createFindParams,
  createOperatorMap,
} from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";

export type GetQuoteParamsType = z.infer<typeof GetQuoteParams>;
export const GetQuoteParams = createFindParams({
  limit: 15,
  offset: 0,
})
  .merge(
    z.object({
      q: z.string().optional(),
      id: z
        .union([z.string(), z.array(z.string()), createOperatorMap()])
        .optional(),
      draft_order_id: z
        .union([z.string(), z.array(z.string()), createOperatorMap()])
        .optional(),
      status: z
        .union([z.string(), z.array(z.string()), createOperatorMap()])
        .optional(),
      created_at: createOperatorMap().optional(),
      updated_at: createOperatorMap().optional(),
    })
  )
  .strict();

export type AcceptQuoteType = z.infer<typeof AcceptQuote>;
export const AcceptQuote = z
  .object({
    // PO is required at acceptance time. Original Quote Request
    // submissions don't usually carry a PO (pricing inquiry); the
    // storefront prefills from cart.metadata.po_number if it exists,
    // otherwise asks the customer for one before allowing accept.
    po_number: z.string().min(1, "PO number is required to accept a quote"),
  })
  .strict();

export type RejectQuoteType = z.infer<typeof RejectQuote>;
export const RejectQuote = z.object({}).strict();

export type StoreCreateQuoteMessageType = z.infer<
  typeof StoreCreateQuoteMessage
>;
export const StoreCreateQuoteMessage = z
  .object({
    text: z.string(),
    item_id: z.string().nullish(),
  })
  .strict();
