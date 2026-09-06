import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

type Input = {
  name: string;
  email: string;
  phone?: string;
  currency_code?: string;
  /* Instant access (2026-09-05): signups default to approved so
     cold-email traffic converts in one sitting. Cardinal can Decline
     junk in admin; declined companies lose the Dashboard. */
  status?: "pending" | "approved";
};

export const createPendingCompanyStep = createStep(
  "create-pending-company",
  async (input: Input, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const company = await companyService.createCompanies({
      name: input.name,
      email: input.email,
      phone: input.phone,
      currency_code: input.currency_code ?? "usd",
      status: input.status ?? "approved",
    });
    return new StepResponse(company, company.id);
  },
  async (companyId, { container }) => {
    if (!companyId) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.deleteCompanies(companyId);
  }
);
