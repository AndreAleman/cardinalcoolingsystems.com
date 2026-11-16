// Single-row settings for CAD Requests (created on first read).

import { model } from "@medusajs/framework/utils"

export const CadSetting = model.define("cad_setting", {
  id: model.id({ prefix: "cadset" }).primaryKey(),
  daily_generation_cap: model.number().default(10), // 0..1000; 0 = queue every new Part Number
  // CAD Review (plan B7): staff approve every CAD Package before the requester gets a link.
  require_review: model.boolean().default(true),
  updated_by: model.text().nullable(),
})
