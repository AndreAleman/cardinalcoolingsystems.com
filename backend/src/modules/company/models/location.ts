import { model } from "@medusajs/framework/utils";
import { Company } from "./company";
import { Employee } from "./employee";

/*
  A Location: one of a Company's destination sites ("where the order is
  sent"). Cardinal manages Locations and Team Member assignments in
  Medusa Admin only — there is no client-side management. The buyer
  picks the order's Location at submit time; a Team Member's assigned
  Location is only the default for that picker and the scope of a
  manager's visibility.
*/
export const Location = model.define("location", {
  id: model.id({ prefix: "loc" }).primaryKey(),
  name: model.text(),
  address_1: model.text(),
  address_2: model.text().nullable(),
  city: model.text(),
  state: model.text(),
  zip: model.text(),
  phone: model.text().nullable(),
  company: model.belongsTo(() => Company, {
    mappedBy: "locations",
  }),
  employees: model.hasMany(() => Employee, {
    mappedBy: "location",
  }),
});
