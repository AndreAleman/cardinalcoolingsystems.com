import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { CompanyDecision } from "../../modules/company/types/status";
import { setCompanyStatusStep } from "./steps/set-company-status";
import { syncApprovedDomainStep } from "./steps/sync-approved-domain";
import { loadWelcomeTargetStep } from "./steps/load-welcome-target";
import { issueWelcomeCodeStep } from "./steps/issue-welcome-code";
import { notifyWelcomeCodeStep } from "./steps/notify-welcome-code";
import { notifyCompanyDecidedStep } from "./steps/notify-company-decided";

export type DecideCompanyInput = {
  company_id: string;
  status: CompanyDecision;
};

/*
  Cardinal approves or declines a Company (ADR-0003, ADR-0007).
  The decision also keeps the Approved Domain list in step, and an
  approval hands over the Welcome Code a Pending signup never got.
*/
export const decideCompanyWorkflow = createWorkflow(
  "decide-company",
  function (input: DecideCompanyInput) {
    const company = setCompanyStatusStep(input);
    syncApprovedDomainStep(input);

    const target = loadWelcomeTargetStep({ company_id: input.company_id });
    when(
      "approval-owes-welcome-code",
      { input, target },
      (d) => d.input.status === "approved" && d.target.needs_welcome
    ).then(function () {
      const welcome = issueWelcomeCodeStep({
        company_id: target.company_id,
        company_name: target.company_name,
        customer_group_id: target.customer_group_id as string,
      });
      notifyWelcomeCodeStep({
        company_name: target.company_name,
        recipients: target.recipients,
        welcome_code: welcome.code,
        ends_at: welcome.ends_at,
      });
    });

    notifyCompanyDecidedStep(input);
    return new WorkflowResponse(company);
  }
);
