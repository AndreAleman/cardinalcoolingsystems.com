import type { AuthenticatedMedusaRequest } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";

/* One Company with the request's configured fields; 404 if missing. */
export async function retrieveAdminCompany(req: AuthenticatedMedusaRequest, id: string) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [company],
  } = await query.graph(
    { entity: "company", fields: req.queryConfig.fields, filters: { id } },
    { throwIfKeyNotFound: true }
  );
  return company;
}
