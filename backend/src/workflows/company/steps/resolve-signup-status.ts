import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import { emailDomain, signupStatusFor } from "../../../utils/signup-policy";

/*
  Instant access is for Approved Domains only (ADR-0007). Everyone
  else is born Pending and waits for Cardinal. If the lookup itself
  fails we fall back to Pending — never to Approved.
*/
export const resolveSignupStatusStep = createStep(
  "resolve-signup-status",
  async (input: { email: string }, { container }) => {
    const domain = emailDomain(input.email);
    let listed = false;
    if (domain) {
      try {
        const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
        const rows = await companyService.listApprovedDomains({ domain }, { take: 1 });
        listed = rows.length > 0;
      } catch (e: any) {
        container
          .resolve("logger")
          .error(`Approved Domain lookup failed; signup held as pending: ${e?.message ?? e}`);
      }
    }
    const status = signupStatusFor(input.email, () => listed);
    return new StepResponse({ status, domain });
  }
);
