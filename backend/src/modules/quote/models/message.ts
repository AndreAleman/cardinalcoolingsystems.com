import { model } from "@medusajs/framework/utils";
import { Quote } from "./quote";

/* A Quote Message — a note either side writes on a Quote (CONTEXT.md).
   Exactly one of admin_id / customer_id is set, naming the author. */
export const Message = model.define("message", {
  id: model.id({ prefix: "mess" }).primaryKey(),
  text: model.text(),
  item_id: model.text().nullable(),
  admin_id: model.text().nullable(),
  customer_id: model.text().nullable(),
  quote: model.belongsTo(() => Quote, { mappedBy: "messages" }),
});
