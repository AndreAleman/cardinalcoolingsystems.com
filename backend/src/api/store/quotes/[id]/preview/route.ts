import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  IOrderModuleService,
  RemoteQueryFunction,
} from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";

/*
  GET /store/quotes/:id/preview — the quote plus the live order-edit
  preview, so the storefront can show staged (not yet accepted) prices
  and quantities. Same ownership scoping as the detail route.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;
  const query = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  );

  const {
    data: [quote],
  } = await query.graph(
    {
      entity: "quote",
      fields: req.queryConfig.fields,
      filters: { id, customer_id: req.auth_context.actor_id },
    },
    { throwIfKeyNotFound: true }
  );

  const orderModuleService: IOrderModuleService = req.scope.resolve(
    Modules.ORDER
  );

  const preview = await orderModuleService.previewOrderChange(
    quote.draft_order_id
  );

  res.status(200).json({
    quote: {
      ...quote,
      order_preview: preview,
    },
  });
};
