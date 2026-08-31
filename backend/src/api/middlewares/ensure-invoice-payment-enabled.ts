import type { MedusaNextFunction, MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "./ensure-company-approved";

/*
  Gate for invoice-only order routes: Cardinal switches invoice payment
  on per Company at approval time. Runs after ensureCompanyApproved, so
  req.company_context is present. Same 403+code shape as the company
  gate so the storefront can render a clear message.
*/
export async function ensureInvoicePaymentEnabled(
  req: CompanyRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { data: companies } = await query.graph({
    entity: "company",
    fields: ["id", "invoice_payment_enabled"],
    filters: { id: req.company_context.companyId },
  });

  if (!companies?.[0]?.invoice_payment_enabled) {
    return res.status(403).json({
      code: "invoice_payment_disabled",
      message: "This company is not set up to pay by invoice.",
    });
  }

  return next();
}
