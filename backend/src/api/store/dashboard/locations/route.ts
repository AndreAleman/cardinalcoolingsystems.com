import type { MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";

/*
  GET /store/dashboard/locations — the Company's Locations for the
  Ship-to picker ("where the order is sent"). Read-only: Cardinal
  manages Locations in Medusa Admin. Behind dashboardGate, scoped to
  the auth-resolved Company (ADR-0004).
*/
export const GET = async (req: CompanyRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { data: locations } = await query.graph({
    entity: "location",
    fields: [
      "id",
      "name",
      "address_1",
      "address_2",
      "city",
      "state",
      "zip",
      "phone",
    ],
    filters: { company_id: req.company_context.companyId },
  });

  res.json({ locations });
};
