import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework";
import { setInvoicePaymentWorkflow } from "../../../../../workflows/company/set-invoice-payment";
import { retrieveAdminCompany } from "../../retrieve";
import type { AdminSetInvoicePaymentType } from "../../validators";

/* Enable or disable invoice payment for a Company. */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSetInvoicePaymentType>,
  res: MedusaResponse
) => {
  await setInvoicePaymentWorkflow(req.scope).run({
    input: { company_id: req.params.id, enabled: req.validatedBody.enabled },
  });
  res.json({ company: await retrieveAdminCompany(req, req.params.id) });
};
