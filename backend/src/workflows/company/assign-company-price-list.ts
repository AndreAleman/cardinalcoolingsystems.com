import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { assignCompanyPriceListStep } from "./steps/assign-company-price-list";

export type AssignCompanyPriceListInput = { company_id: string; price_list_id: string | null };

export const assignCompanyPriceListWorkflow = createWorkflow<
  AssignCompanyPriceListInput,
  { id: string },
  []
>("assign-company-price-list", function (input) {
  const company = assignCompanyPriceListStep(input);
  return new WorkflowResponse(company);
});
