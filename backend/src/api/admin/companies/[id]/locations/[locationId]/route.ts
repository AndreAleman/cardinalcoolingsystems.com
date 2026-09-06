import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  deleteLocationWorkflow,
  updateLocationWorkflow,
} from "../../../../../../workflows/company/manage-location";
import type { AdminUpdateLocationType } from "../../../validators";

/* POST — edit a Location. DELETE — remove it (assignments are cleared). */

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateLocationType>,
  res: MedusaResponse
) => {
  const { result } = await updateLocationWorkflow(req.scope).run({
    input: {
      company_id: req.params.id,
      location_id: req.params.locationId,
      ...req.validatedBody,
    },
  });
  res.json({ location: result });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteLocationWorkflow(req.scope).run({
    input: { company_id: req.params.id, location_id: req.params.locationId },
  });
  res.json({ id: req.params.locationId, object: "location", deleted: true });
};
