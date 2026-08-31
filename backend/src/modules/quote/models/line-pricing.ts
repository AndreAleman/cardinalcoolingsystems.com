import { model } from "@medusajs/framework/utils";
import { Quote } from "./quote";

/*
  Internal per-line pricing for quote costing: unit cost and markup %.
  The customer-facing sell price lives on the order line item (unit_price
  via the order-edit machinery); this table is ADMIN-ONLY data and must
  never be exposed through any /store response.

  Money semantics: cost is stored as-is (49.99 = 49.99, not cents),
  matching Medusa price conventions.
*/
export const LinePricing = model.define("quote_line_pricing", {
  id: model.id({ prefix: "qlp" }).primaryKey(),
  item_id: model.text(),
  cost: model.float(),
  markup_pct: model.float(),
  quote: model.belongsTo(() => Quote, { mappedBy: "line_pricings" }),
});
