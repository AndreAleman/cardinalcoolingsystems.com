import { model } from "@medusajs/framework/utils";
import { Company } from "./company";

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
});
