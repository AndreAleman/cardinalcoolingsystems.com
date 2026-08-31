import { model } from "@medusajs/framework/utils";
import { LinePricing } from "./line-pricing";
import { Message } from "./message";

/* A Quote is Cardinal's priced answer to a Quote Request — see CONTEXT.md.
   It wraps a draft order + an open order edit; accepting confirms the edit
   and promotes the draft order to a real pending Order. */
export const Quote = model.define("quote", {
  id: model.id({ prefix: "quo" }).primaryKey(),
  status: model
    .enum([
      "pending_merchant",
      "pending_customer",
      "accepted",
      "customer_rejected",
      "merchant_rejected",
    ])
    .default("pending_merchant"),
  customer_id: model.text(),
  draft_order_id: model.text(),
  order_change_id: model.text(),
  cart_id: model.text(),
  messages: model.hasMany(() => Message),
  // Internal per-line cost/markup rows. Admin-only — never serialized on /store.
  line_pricings: model.hasMany(() => LinePricing),
});
