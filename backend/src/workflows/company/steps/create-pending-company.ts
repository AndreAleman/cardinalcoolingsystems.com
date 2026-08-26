import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";

type Input = { name: string; email: string; currency_code?: string };

export const createPendingCompanyStep = createStep(
  "create-pending-company",
  async (input: Input, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const company = await companyService.createCompanies({
      name: input.name,
      email: input.email,
      currency_code: input.currency_code ?? "usd",
      status: "pending",
    });
    return new StepResponse(company, company.id);
  },
  async (companyId, { container }) => {
    if (!companyId) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.deleteCompanies(companyId);
  }
);
