import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createQuoteMessageWorkflow } from "../../../../../workflows/quote/workflows";
import { StoreCreateQuoteMessageType } from "../../validators";

export const POST = async (
  req: AuthenticatedMedusaRequest<StoreCreateQuoteMessageType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  // Ownership gate: the message workflow is shared with the admin
  // route, so the customer-side check lives here — 404 unless the quote
  // belongs to the caller.
  await query.graph(
    {
      entity: "quote",
      fields: ["id"],
      filters: { id, customer_id: req.auth_context.actor_id },
    },
    { throwIfKeyNotFound: true }
  );

  await createQuoteMessageWorkflow(req.scope).run({
    input: {
      text: req.validatedBody.text!,
      item_id: req.validatedBody.item_id,
      customer_id: req.auth_context.actor_id,
      quote_id: id,
    },
  });

  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ quote });
};
