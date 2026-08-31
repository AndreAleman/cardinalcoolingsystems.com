import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { AdminGetCompaniesParamsType } from "./validators";

/* GET /admin/companies — list, filterable by status. */
export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetCompaniesParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { fields, pagination } = req.queryConfig;

  const { data: companies, metadata } = await query.graph({
    entity: "company",
    fields,
    filters: req.filterableFields,
    pagination: { ...pagination, order: { created_at: "DESC" } },
  });

  res.json({
    companies,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};
