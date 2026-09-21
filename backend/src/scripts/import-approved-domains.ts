import fs from "fs";
import path from "path";
import { ExecArgs } from "@medusajs/framework/types";
import { COMPANY_MODULE } from "../modules/company";
import CompanyModuleService from "../modules/company/service";
import {
  domainsFromOutreachCsv,
  emailDomain,
  planDomainImport,
} from "../utils/signup-policy";

/*
  Load an outreach CSV (Instantly export) into the Approved Domain
  list (ADR-0007). Safe to re-run: listed domains are skipped, and the
  domain of a Declined Company is never re-listed.

    npx medusa exec ./src/scripts/import-approved-domains.ts ../cc-firt-lk.csv
    npx medusa exec ./src/scripts/import-approved-domains.ts ../list.csv dry-run

  The CSV needs an "Email" column; other columns are ignored. The CSV
  itself is gitignored — it never ships with the code.
*/
export default async function importApprovedDomains({ container, args }: ExecArgs) {
  const logger = container.resolve("logger");
  // A bare word, not a --flag: the Medusa CLI rejects flags it does not know.
  const dryRun = (args ?? []).includes("dry-run");
  const file = (args ?? []).find((a) => a !== "dry-run");
  if (!file) {
    throw new Error("Usage: medusa exec ./src/scripts/import-approved-domains.ts <csv> [dry-run]");
  }
  const csvPath = path.resolve(process.cwd(), file);
  const { domains, skipped } = domainsFromOutreachCsv(fs.readFileSync(csvPath, "utf8"));

  const companyService = container.resolve<CompanyModuleService>(COMPANY_MODULE);
  const listed = await companyService.listApprovedDomains({}, { select: ["domain"], take: null as any });
  const declined = await companyService.listCompanies(
    { status: "declined" },
    { select: ["email"], take: null as any }
  );
  const declinedDomains = declined
    .map((c) => emailDomain(c.email))
    .filter((d): d is string => !!d);

  const plan = planDomainImport(
    domains,
    listed.map((r) => r.domain),
    declinedDomains
  );

  logger.info(
    `[approved-domains] ${csvPath}: ${domains.length} domains in CSV → ` +
      `${plan.add.length} to add, ${plan.already.length} already listed, ` +
      `${plan.blocked.length} blocked (declined company), ${skipped.length} rows skipped`
  );
  for (const s of skipped) logger.info(`[approved-domains] skipped ${s.reason}: "${s.value}"`);
  for (const d of plan.blocked) logger.info(`[approved-domains] blocked (declined): ${d}`);

  if (dryRun) {
    logger.info("[approved-domains] dry run — nothing written");
    return;
  }
  for (let i = 0; i < plan.add.length; i += 200) {
    await companyService.createApprovedDomains(
      plan.add.slice(i, i + 200).map((domain) => ({ domain, source: "import" as const }))
    );
  }
  const [, total] = await companyService.listAndCountApprovedDomains({}, { take: 1 });
  logger.info(`[approved-domains] done — ${plan.add.length} added, ${total} on the list now`);
}
