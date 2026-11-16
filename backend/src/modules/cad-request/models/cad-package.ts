// A CAD Package: the files generated for one Part Number (STEP + PDF for the transition and the
// manifold; PDF only for the kit, strainer and hose, plan B8). This row is the cache index; the
// files live in the private CAD store (lib/cad/cad-store.ts). One row per cache_key
// "{part_number}@{tables_hash}-g{generator_version}-d{drawing_version}".

import { model } from "@medusajs/framework/utils"

export const CadPackage = model.define("cad_package", {
  id: model.id({ prefix: "cadpkg" }).primaryKey(),
  part_number: model.text().index(),
  cache_key: model.text().unique(),
  builder_type: model.enum(["cdu-kit", "row-manifold", "transition", "strainer", "hose"]),
  configuration: model.json(), // the builder's canonical options
  tables_hash: model.text(),
  generator_version: model.text(),
  drawing_version: model.number(),
  status: model.enum(["generating", "ready", "failed"]).default("generating"),
  step_key: model.text().nullable(),
  pdf_key: model.text().nullable(),
  step_bytes: model.number().nullable(),
  pdf_bytes: model.number().nullable(),
  step_sha256: model.text().nullable(),
  pdf_sha256: model.text().nullable(),
  counted_against_cap: model.boolean().default(false),
  cap_day: model.text().index().nullable(), // "2026-10-18" (America/New_York)
  generated_at: model.dateTime().nullable(),
  error: model.text().nullable(),
})
