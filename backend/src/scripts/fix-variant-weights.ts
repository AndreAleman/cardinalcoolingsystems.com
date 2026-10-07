// Fixes variant shipping weights that are missing or wrong (GMC needs a
// shipping weight; the product feed drops weightless variants, and parcel
// rates are calculated from weight).
//
// Source of truth: SaniTube's WooCommerce export
// (wc-product-export-9-1-2026-1767987866546.csv), matched by SKU. Store
// convention: WC weight in lb rounded UP to a whole pound (minimum 1 lb).
// The table below is that export filtered to the SKUs that are wrong on
// Cardinal and/or Cowbird as of 2026-10-06 (public Store API snapshot):
//   - weight missing (null or 0), or
//   - weight at the 1 lb placeholder while WC says more than 1 lb.
// The other ~570 variants at 1 lb were checked against WC and are correct
// (WC weight <= 1 lb rounds up to 1).
//
// The same file runs on both stores (Cardinal and Cowbird Depot).
//
// Dry run (default, read-only; prints old -> new per SKU):
//   npx medusa exec ./src/scripts/fix-variant-weights.ts
// Write:
//   npx medusa exec ./src/scripts/fix-variant-weights.ts apply
//
// Safety: a variant is only changed when its current weight is missing,
// 0, or the 1 lb placeholder. Any other current value is reported and
// left alone. Idempotent: variants already at the target are skipped.
//
// The script also lists, without changing them, variants that still need
// a weight from someone: no weight and no WC weight, or 1 lb with no WC
// weight to confirm it (A270 tube lengths, long I-Line ferrules, etc.).

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/medusa/core-flows"

// SKU -> { wc: WooCommerce weight (lb), weight: target weight (lb) }
const FIXES: Record<string, { wc: number; weight: number }> = {
  "22MP6-050": { wc: 0.22, weight: 1 },
  "22MP6-075": { wc: 0.25, weight: 1 },
  "22MP6-075050": { wc: 0.26, weight: 1 },
  "22MP6-100": { wc: 0.3, weight: 1 },
  "22MP6-1000125": { wc: 0.3, weight: 1 },
  "22MP6-100025": { wc: 0.35, weight: 1 },
  "22MP6-100050": { wc: 0.4, weight: 1 },
  "22MP6-100075": { wc: 0.4, weight: 1 },
  "22MP6-100375": { wc: 0.35, weight: 1 },
  "22MP6-150": { wc: 0.45, weight: 1 },
  "22MP6-200150": { wc: 1.2, weight: 2 },
  "22MP6-250": { wc: 1.2, weight: 2 },
  "22MP6-250150": { wc: 1.2, weight: 2 },
}

// SKUs with no weight in the WC export (or not in it at all), so a 1 lb
// value cannot be confirmed. Report-only.
const NO_WC_WEIGHT = new Set([
  "14A4-400",
  "14WLI6-100",
  "14WLI6-150",
  "14WLI6-200",
  "14WLI6-250",
  "14WLI6-300",
  "14WLI6-400",
  "14WLI6-600",
  "15WLI6-100",
  "15WLI6-150",
  "15WLI6-200",
  "15WLI6-250",
  "15WLI6-300",
  "15WLI6-400",
  "15WLI6-600",
  "19MPX6-600",
  "7WL4P-600",
  "7WL6P-600",
  "9MP6-600",
  "AI270P-4100",
  "AI270P-4150",
  "AI270P-4200",
  "AI270P-4250",
  "AI270P-4300",
  "AI270P-4400",
  "AI270P-4500",
  "AI270P-4601",
  "AI270P-4801",
  "AI270P-6050",
  "AI270P-6075",
  "AI270P-6100",
  "AI270P-61000",
  "AI270P-61200",
  "AI270P-6150",
  "AI270P-6200",
  "AI270P-6250",
  "AI270P-6300",
  "AI270P-6400",
  "AI270P-6801",
  "AW2KS6P-600",
  "AW2S6P-600",
  "P24-075",
])

const PLACEHOLDER_LB = 1

type VariantRow = {
  id: string
  sku: string | null
  title: string | null
  weight: number | string | null
  product?: { title?: string | null } | null
}

const num = (w: VariantRow["weight"]): number | null =>
  w === null || w === undefined || w === "" ? null : Number(w)

export default async function fixVariantWeights({ container, args }: ExecArgs) {
  const apply = (args ?? []).includes("apply")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: variants } = (await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "title", "weight", "product.title"],
  })) as { data: VariantRow[] }

  const updates: { id: string; weight: number }[] = []
  const lines: string[] = []
  const skippedUnexpected: string[] = []
  const needsWeight: string[] = []
  const unconfirmedPlaceholder: string[] = []

  for (const v of variants) {
    const sku = (v.sku ?? "").trim().toUpperCase()
    const current = num(v.weight)
    const label = `${v.sku ?? "(no sku)"}  ${v.product?.title ?? ""} / ${v.title ?? ""}`
    const fix = sku ? FIXES[sku] : undefined

    if (fix) {
      if (current === fix.weight) continue
      const isPlaceholder = !current || current === PLACEHOLDER_LB
      if (!isPlaceholder) {
        skippedUnexpected.push(
          `${label}: current ${current} lb, WC ${fix.wc} lb -> left alone`
        )
        continue
      }
      updates.push({ id: v.id, weight: fix.weight })
      lines.push(
        `${label}: ${current ?? "none"} -> ${fix.weight} lb (WC ${fix.wc} lb)`
      )
      continue
    }

    if (!current) needsWeight.push(label)
    else if (current === PLACEHOLDER_LB && NO_WC_WEIGHT.has(sku))
      unconfirmedPlaceholder.push(label)
  }

  logger.info(`Variants scanned: ${variants.length}`)
  logger.info(`\nWeight changes (${updates.length}):`)
  lines.forEach((l) => logger.info(`  ${l}`))

  if (skippedUnexpected.length) {
    logger.warn(`\nIn the fix table but with an unexpected current weight (${skippedUnexpected.length}):`)
    skippedUnexpected.forEach((l) => logger.warn(`  ${l}`))
  }
  logger.info(`\nStill no weight, nothing in WC to fix it (${needsWeight.length}) - needs a real weight:`)
  needsWeight.forEach((l) => logger.info(`  ${l}`))
  logger.info(`\nAt 1 lb with no WC weight to confirm it (${unconfirmedPlaceholder.length}) - check these:`)
  unconfirmedPlaceholder.forEach((l) => logger.info(`  ${l}`))

  if (!apply) {
    logger.info("\nDry run: nothing written. Re-run with `apply` to write the weight changes.")
    return
  }
  if (!updates.length) {
    logger.info("\nNothing to write.")
    return
  }

  await updateProductVariantsWorkflow(container).run({
    input: { product_variants: updates },
  })
  logger.info(`\nWrote ${updates.length} variant weights.`)
}
