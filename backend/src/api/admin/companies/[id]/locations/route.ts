import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  createLocationWorkflow,
  type CreateLocationInput,
} from "../../../../../workflows/company/manage-location";
import type { AdminCreateLocationType } from "../../validators";

/*
  /admin/companies/:id/locations — a Company's destination sites.
  Cardinal-managed only: there is no client-side Location management.
*/

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
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
      "company_id",
      "created_at",
    ],
    filters: { company_id: req.params.id },
  });
  res.json({ locations, count: locations.length });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateLocationType>,
  res: MedusaResponse
) => {
  // Zod enforced the required fields at runtime; the cast bridges the
  // repo's non-strict tsconfig (zod infers everything optional there).
  const { result } = await createLocationWorkflow(req.scope).run({
    input: {
      company_id: req.params.id,
      ...req.validatedBody,
    } as CreateLocationInput,
  });
  res.json({ location: result });
};
