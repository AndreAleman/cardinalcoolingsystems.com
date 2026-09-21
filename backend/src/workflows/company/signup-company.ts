import { createRemoteLinkStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { COMPANY_MODULE } from "../../modules/company";
import { validateNotTeamMemberStep } from "./steps/validate-not-team-member";
import { resolveSignupStatusStep } from "./steps/resolve-signup-status";
import { createPendingCompanyStep } from "./steps/create-pending-company";
import { updateCustomerPhoneStep } from "./steps/update-customer-phone";
import { createAdminTeamMemberStep } from "./steps/create-admin-team-member";
import { createCompanyCustomerGroupStep } from "./steps/create-company-customer-group";
import { issueWelcomeCodeStep } from "./steps/issue-welcome-code";
import { notifyCompanySignedUpStep } from "./steps/notify-company-signed-up";

export type SignupCompanyInput = {
  name: string;
  phone: string;
  customer: { id: string; email: string; first_name?: string | null };
};

export type SignupCompanyOutput = {
  company: { id: string; name: string; status: string };
  // Only an instantly-approved signup gets its Welcome Code now; a
  // Pending Company gets it when Cardinal approves (ADR-0007).
  welcome?: { code: string; ends_at: string } | null;
};

/*
  Signup: Company + admin Team Member + Customer Group in one
  transaction. An Approved Domain is born Approved and gets its Welcome
  Code and welcome email at once; anyone else is born Pending, gets no
  code and no email to their (unvetted) address, and Cardinal is asked
  to decide (ADR-0007). Emails are best-effort at the end.
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

    const access = resolveSignupStatusStep({ email: input.customer.email });

    const company = createPendingCompanyStep({
      name: input.name,
      email: input.customer.email,
      phone: input.phone,
      status: access.status,
    });

    updateCustomerPhoneStep({
      customer_id: input.customer.id,
      phone: input.phone,
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

    const welcome = when("signup-is-instant", { access }, (d) => d.access.status === "approved").then(
      function () {
        return issueWelcomeCodeStep({
          company_id: company.id,
          company_name: input.name,
          customer_group_id: group.id,
        });
      }
    );

    const notice = transform({ company, input, access, welcome }, (d) => ({
      company: { id: d.company.id, name: d.company.name },
      customer: d.input.customer,
      status: d.access.status,
      welcome_code: d.welcome?.code ?? null,
      ends_at: d.welcome?.ends_at ?? null,
    }));
    notifyCompanySignedUpStep(notice);

    return new WorkflowResponse({ company, welcome });
  }
);
