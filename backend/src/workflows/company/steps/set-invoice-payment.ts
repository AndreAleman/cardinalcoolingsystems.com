import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

/* Flip a Company's invoice_payment_enabled flag; compensation restores
   the previous value. */
export const setInvoicePaymentStep = createStep(
  "set-invoice-payment",
  async (input: { company_id: string; enabled: boolean }, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const before = await companyService.retrieveCompany(input.company_id);
    const company = await companyService.updateCompanies({
      id: input.company_id,
      invoice_payment_enabled: input.enabled,
    });
    return new StepResponse(company, {
      company_id: input.company_id,
      enabled: !!before.invoice_payment_enabled,
    });
  },
  async (prev, { container }) => {
    if (!prev) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.updateCompanies({
      id: prev.company_id,
      invoice_payment_enabled: prev.enabled,
    });
  }
);
