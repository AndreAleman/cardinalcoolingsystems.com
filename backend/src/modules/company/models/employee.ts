import { model } from "@medusajs/framework/utils";
import { Company } from "./company";
import { Location } from "./location";

export const Employee = model.define("employee", {
  id: model
    .id({
      prefix: "emp",
    })
    .primaryKey(),
  spending_limit: model.bigNumber().default(0),
  // Team Member Role. Every new person is admin for now; member and
  // manager exist for later (approvals, scoped visibility).
  role: model.enum(["member", "manager", "admin"]).default("admin"),
  company: model.belongsTo(() => Company, {
    mappedBy: "employees",
  }),
  // The Team Member's home site. Optional: someone with no Location
  // falls back to their role rule company-wide (a manager with no site
  // sees the whole Company). Assigned by Cardinal in Medusa Admin only.
  location: model
    .belongsTo(() => Location, {
      mappedBy: "employees",
    })
    .nullable(),
});
