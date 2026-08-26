import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { retrieveAdminCompany } from "../retrieve";

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  res.json({ company: await retrieveAdminCompany(req, req.params.id) });
};
