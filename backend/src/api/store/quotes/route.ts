import type { MedusaResponse } from "@medusajs/framework";
import type { AuthenticatedMedusaRequest } from "@medusajs/framework";
import { RemoteQueryFunction } from "@medusajs/framework/types";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { GetQuoteParamsType } from "./validators";

/*
  GET /store/quotes — the signed-in Team Member's own quotes. Behind
  dashboardGate; scoped by customer_id so nobody ever lists another
  Company's quotes. New quotes are created via
  POST /store/order-form/request-quote, not here.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest<GetQuoteParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  );

  const { fields, pagination } = req.queryConfig;
  const { data: quotes, metadata } = await query.graph({
    entity: "quote",
    fields,
    filters: {
      customer_id: req.auth_context.actor_id,
    },
    pagination: {
      ...pagination,
      skip: pagination.skip!,
    },
  });

  res.json({
    quotes,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};
