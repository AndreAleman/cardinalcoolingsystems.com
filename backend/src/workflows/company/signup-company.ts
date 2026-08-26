import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../modules/company";
import { validateNotTeamMemberStep } from "./steps/validate-not-team-member";
import { createPendingCompanyStep } from "./steps/create-pending-company";
import { createAdminTeamMemberStep } from "./steps/create-admin-team-member";
import { createCompanyCustomerGroupStep } from "./steps/create-company-customer-group";
import { issueWelcomeCodeStep } from "./steps/issue-welcome-code";
import { notifyCompanySignedUpStep } from "./steps/notify-company-signed-up";

export type SignupCompanyInput = {
  name: string;
  customer: { id: string; email: string; first_name?: string | null };
};

export type SignupCompanyOutput = {
  company: { id: string; name: string; status: string };
  welcome: { code: string; ends_at: string };
};

/*
  Signup: Pending Company + admin Team Member + Customer Group +
  Welcome Code, in one transaction. Emails are best-effort at the end.
*/
// Explicit generics: the inferred type is not portable under pnpm and
// breaks declaration emit in `medusa build`.
export const signupCompanyWorkflow = createWorkflow<
  SignupCompanyInput,
  SignupCompanyOutput,
  []
>(
  "signup-company",
  function (input: SignupCompanyInput) {
    validateNotTeamMemberStep({ customer_id: input.customer.id });

    const company = createPendingCompanyStep({
      name: input.name,
      email: input.customer.email,
    });

    const teamMember = createAdminTeamMemberStep({ company_id: company.id });

    const group = createCompanyCustomerGroupStep({
      company_name: input.name,
      customer_id: input.customer.id,
    });

    const links = transform({ company, teamMember, group, input }, (d) => [
      {
        [COMPANY_MODULE]: { employee_id: d.teamMember.id },
        [Modules.CUSTOMER]: { customer_id: d.input.customer.id },
      },
      {
        [COMPANY_MODULE]: { company_id: d.company.id },
        [Modules.CUSTOMER]: { customer_group_id: d.group.id },
      },
    ]);
    createRemoteLinkStep(links);

    const welcome = issueWelcomeCodeStep({
      company_id: company.id,
      company_name: input.name,
      customer_group_id: group.id,
    });

    notifyCompanySignedUpStep({
      company: company,
      customer: input.customer,
      welcome_code: welcome.code,
      ends_at: welcome.ends_at,
    });

    return new WorkflowResponse({ company, welcome });
  }
);
