import { model } from "@medusajs/framework/utils";

/*
  A Configuration a buyer priced on a Builder (plan B5, CONTEXT.md
  "Configuration"). Every resolve is recorded, anonymous ones included:
  this table is the "what to stock next" demand signal.

  Upserted by config_key (the Configuration's identity): the first
  creator is kept, resolve_count and last_resolved_at are bumped, and
  the BOM / pricing fields hold the latest resolve.
*/
export const BuildConfiguration = model
  .define("build_configuration", {
    id: model.id({ prefix: "bcfg" }).primaryKey(),
    builder_type: model.text().index(),
    config_key: model.text().unique(),
    /** Canonical options (the share link's query, as JSON). */
    options: model.json(),
    /** Resolved BOM lines of the latest resolve. */
    bom: model.json(),
    pricing_mode: model.enum(["instant", "quote"]),
    /** Total Instant price of the latest resolve; null in Quote mode. */
    instant_price: model.bigNumber().nullable(),
    weight_lb: model.float(),
    part_number: model.text(),
    created_by_domain: model.text().nullable(),
    created_by_customer_id: model.text().nullable(),
    resolve_count: model.number().default(1),
    last_resolved_at: model.dateTime(),
  })
  .indexes([{ on: ["pricing_mode"] }]);
