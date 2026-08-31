import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { customerAcceptQuoteWorkflow } from "../../../../../workflows/quote/workflows";
import { AcceptQuoteType } from "../../validators";

/*
  POST /store/quotes/:id/accept — po_number required (validator). The
  workflow gates ownership + status, confirms the order edit, and
  promotes the draft order to a real pending Order.
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<AcceptQuoteType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  await customerAcceptQuoteWorkflow(req.scope).run({
    input: {
      ...req.validatedBody,
      quote_id: id,
      customer_id: req.auth_context.actor_id,
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

  return res.json({ quote });
};
