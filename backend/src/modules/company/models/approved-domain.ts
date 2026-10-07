import { model } from "@medusajs/framework/utils";

/*
  An Approved Domain: an email domain whose signups get instant access
  (ADR-0007). The list is the set of companies Cardinal is actively
  emailing, plus the domain of any Company Cardinal approves by hand.
  Declining a Company removes its domain. Stored lowercase, exact
  domain — no wildcards. Free-mail domains are never stored.
*/
export const ApprovedDomain = model
  .define("approved_domain", {
    id: model.id({ prefix: "apdom" }).primaryKey(),
    domain: model.text(),
    // "import" = outreach CSV; "approval" = Cardinal approved a Company.
    source: model.enum(["import", "approval"]).default("import"),
  })
  .indexes([{ on: ["domain"], unique: true, where: "deleted_at IS NULL" }]);
