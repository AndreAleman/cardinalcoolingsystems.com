import { model } from "@medusajs/framework/utils";
import { Company } from "./company";

/*
  An Invite: one email, one Company, one single-use token. Accepting it
  makes the customer with that email a Team Member of the Company.
*/
export const CompanyInvite = model.define("company_invite", {
  id: model.id({ prefix: "cinv" }).primaryKey(),
  email: model.text(),
  token: model.text().unique(),
  role: model.enum(["member", "manager", "admin"]).default("admin"),
  invited_by: model.text().nullable(),
  expires_at: model.dateTime(),
  accepted_at: model.dateTime().nullable(),
  company: model.belongsTo(() => Company, { mappedBy: "invites" }),
});
