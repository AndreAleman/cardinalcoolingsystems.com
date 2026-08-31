import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import CompanyModule from "../modules/company";

/*
  Every Company owns exactly one Customer Group. It carries the
  Company's Price List and scopes Company-only codes (Welcome Code).
*/
export default defineLink(
  CompanyModule.linkable.company,
  CustomerModule.linkable.customerGroup
);
