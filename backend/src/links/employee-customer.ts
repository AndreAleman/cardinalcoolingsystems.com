import { defineLink } from "@medusajs/framework/utils";
import CustomerModule from "@medusajs/medusa/customer";
import CompanyModule from "../modules/company";

/*
  The keystone link: a Team Member (employee) is exactly one Customer.
  Every "which Company am I in?" question walks customer → employee →
  company through this link (ADR-0004).
*/
export default defineLink(
  CompanyModule.linkable.employee,
  CustomerModule.linkable.customer
);
