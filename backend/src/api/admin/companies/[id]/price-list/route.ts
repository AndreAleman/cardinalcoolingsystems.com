import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { assignCompanyPriceListWorkflow } from "../../../../../workflows/company/assign-company-price-list";
import { retrieveAdminCompany } from "../../retrieve";
import type { AdminAssignCompanyPriceListType } from "../../validators";

/* Attach or clear a Company-exclusive Custom Price List. */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminAssignCompanyPriceListType>,
  res: MedusaResponse
) => {
  await assignCompanyPriceListWorkflow(req.scope).run({
    input: { company_id: req.params.id, price_list_id: req.validatedBody.price_list_id },
  });
  res.json({ company: await retrieveAdminCompany(req, req.params.id) });
};
