import { defineLink } from "@medusajs/framework/utils";
import OrderModule from "@medusajs/medusa/order";
import CompanyModule from "../modules/company";

// A Company has MANY Orders. isList must live on the ORDER side: a
// one-to-one shape makes the link module's uniqueness check reject the
// second order linked to a company ("Cannot create multiple links
// between 'order' and 'company'").
export default defineLink(
  { linkable: OrderModule.linkable.order, isList: true },
  CompanyModule.linkable.company
);
