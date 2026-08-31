import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { CompanyDecision } from "../../modules/company/types/status";
import { setCompanyStatusStep } from "./steps/set-company-status";
import { notifyCompanyDecidedStep } from "./steps/notify-company-decided";

export type DecideCompanyInput = {
  company_id: string;
  status: CompanyDecision;
};

/* Cardinal approves or declines a Pending Company (ADR-0003). */
export const decideCompanyWorkflow = createWorkflow(
  "decide-company",
  function (input: DecideCompanyInput) {
    const company = setCompanyStatusStep(input);
    notifyCompanyDecidedStep(input);
    return new WorkflowResponse(company);
  }
);
