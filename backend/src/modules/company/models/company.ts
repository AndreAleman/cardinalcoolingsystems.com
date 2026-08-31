import { model } from "@medusajs/framework/utils";
import { Employee } from "./employee";
import { CompanyInvite } from "./company-invite";

export const Company = model.define("company", {
  id: model
    .id({
      prefix: "comp",
    })
    .primaryKey(),
  name: model.text(),
  email: model.text(),
  phone: model.text().nullable(),
  address: model.text().nullable(),
  city: model.text().nullable(),
  state: model.text().nullable(),
  zip: model.text().nullable(),
  country: model.text().nullable(),
  logo_url: model.text().nullable(),
  currency_code: model.text().nullable(),
  // Pending until Cardinal approves the Company in Medusa Admin (ADR-0003).
  status: model.enum(["pending", "approved", "declined"]).default("pending"),
  // The Welcome Code issued at signup, kept so the waiting screen can show it.
  welcome_code: model.text().nullable(),
  // A Custom (override) Price List that is scoped to this Company's Customer Group.
  price_list_id: model.text().nullable(),
  spending_limit_reset_frequency: model
    .enum(["never", "daily", "weekly", "monthly", "yearly"])
    .default("monthly"),
  // Cardinal decides at approval time whether this Company may pay by
  // invoice. ON: every order any size is placed unpaid and billed offline.
  // OFF: the weight/total payment rules apply (see utils/payment-rules).
  invoice_payment_enabled: model.boolean().default(false),
  employees: model.hasMany(() => Employee),
  invites: model.hasMany(() => CompanyInvite),
});
