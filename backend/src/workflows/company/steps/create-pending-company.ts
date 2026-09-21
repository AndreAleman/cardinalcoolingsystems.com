import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

type Input = {
  name: string;
  email: string;
  phone?: string;
  currency_code?: string;
  /* Decided by resolveSignupStatusStep (ADR-0007): Approved Domains
     get instant access, everyone else waits for Cardinal. Omitted =
     pending, the safe default. */
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
      status: input.status ?? "pending",
    });
    return new StepResponse(company, company.id);
  },
  async (companyId, { container }) => {
    if (!companyId) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.deleteCompanies(companyId);
  }
);
