import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import {
  canDecideCompany,
  CompanyDecision,
  CompanyStatus,
} from "../../../modules/company/types/status";

export const setCompanyStatusStep = createStep(
  "set-company-status",
  async (input: { company_id: string; status: CompanyDecision }, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const before = await companyService.retrieveCompany(input.company_id);
    const from = before.status as CompanyStatus;
    if (!canDecideCompany(from, input.status)) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `A ${from} Company cannot be ${input.status}`
      );
    }
    const company = await companyService.updateCompanies({
      id: input.company_id,
      status: input.status,
    });
    return new StepResponse(company, { company_id: input.company_id, status: from });
  },
  async (prev, { container }) => {
    if (!prev) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    await companyService.updateCompanies({ id: prev.company_id, status: prev.status });
  }
);
