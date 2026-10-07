import { COMPANY_MODULE } from "../../src/modules/company";

/*
  ADR-0007: only an Approved Domain signs up with instant access.
  Suites that sign up through the API and need an Approved Company list
  their buyers' domains first. prospect.test / retail.test are left off
  on purpose — they are the "not on the list" cases.
*/
export const TEST_APPROVED_DOMAINS = [
  "acme.test",
  "alpha.test",
  "bravo.test",
  "bolt.test",
  "heavy.test",
  "y.test",
];

export const approveDomains = async (
  container: any,
  domains: string[] = TEST_APPROVED_DOMAINS
) => {
  const companyService = container.resolve(COMPANY_MODULE) as any;
  const existing = await companyService.listApprovedDomains({ domain: domains });
  const have = new Set(existing.map((d: any) => d.domain));
  const missing = domains.filter((d) => !have.has(d));
  if (missing.length) {
    await companyService.createApprovedDomains(
      missing.map((domain) => ({ domain, source: "import" }))
    );
  }
};
