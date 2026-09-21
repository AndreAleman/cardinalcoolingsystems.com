import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { COMPANY_MODULE } from "../../../modules/company";
import CompanyModuleService from "../../../modules/company/service";
import type { CompanyDecision } from "../../../modules/company/types/status";
import { emailDomain, isAllowlistable } from "../../../utils/signup-policy";

type Undo =
  | { action: "created"; id: string }
  | { action: "deleted"; domain: string; source: "import" | "approval" }
  | null;

/*
  A decision keeps the Approved Domain list in step (ADR-0007):
  approving a Company lists its domain so colleagues skip the queue;
  declining removes it so they do not walk straight back in. Free-mail
  domains are never listed.
*/
export const syncApprovedDomainStep = createStep(
  "sync-approved-domain",
  async (input: { company_id: string; status: CompanyDecision }, { container }) => {
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    const company = await companyService.retrieveCompany(input.company_id);
    const domain = emailDomain(company.email);
    if (!isAllowlistable(domain)) return new StepResponse(null, null as Undo);

    const [existing] = await companyService.listApprovedDomains({ domain }, { take: 1 });

    if (input.status === "approved") {
      if (existing) return new StepResponse(null, null as Undo);
      const created = await companyService.createApprovedDomains({
        domain,
        source: "approval",
      });
      return new StepResponse(null, { action: "created", id: created.id } as Undo);
    }

    if (!existing) return new StepResponse(null, null as Undo);
    await companyService.deleteApprovedDomains(existing.id);
    return new StepResponse(null, {
      action: "deleted",
      domain,
      source: existing.source,
    } as Undo);
  },
  async (undo: Undo, { container }) => {
    if (!undo) return;
    const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
    if (undo.action === "created") {
      await companyService.deleteApprovedDomains(undo.id);
    } else {
      await companyService.createApprovedDomains({ domain: undo.domain, source: undo.source });
    }
  }
);
