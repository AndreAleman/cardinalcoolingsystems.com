/**
 * Sanitube tube SKUs, October 2026 (supplier answers from Todd).
 *
 * Sanitube now only offers AI270 tube, except four A270 SKUs:
 *   A270P-4100, A270P-6050, A270P-6075, A270P-6100.
 * Cardinal's tube product (handle id-od-pol-tube-a270-3a-import) carries
 * those four as AI270P-4100 / -6050 / -6075 / -6100. This script renames
 * them to their A270 SKUs so the QuickBooks inventory sync (which matches
 * by SKU) and Sanitube's paperwork line up. Price, weight and options stay
 * as they are.
 *
 * What it does:
 *   - renames the variant SKU AI270P-xxxx -> A270P-xxxx and sets
 *     metadata.sanitube_sku to the A270 SKU;
 *   - renames the variant's linked inventory item SKU too, when it still
 *     holds the old SKU (the QB webhooks also prefer the linked item now);
 *   - sets metadata.sanitube_sku to the variant's own SKU on the other
 *     AI270 tube variants (the pricing script had stamped "A270P-xxxx" on
 *     all of them; Sanitube's SKU for those is the AI270 one);
 *   - REPORTS, without changing them:
 *       * any other variant whose SKU starts with A270 (excluded by Sanitube);
 *       * AI270P-4402 (0.065" wall, not stocked; excluded);
 *       * AI270P-4400 whose Wall option is not 0.083";
 *       * AI270P-61000 / AI270P-61200 whose Wall option is not 0.120".
 *
 * Usage (from backend/):
 *   npx medusa exec ./src/scripts/rename-a270-tube-skus.ts          # dry run (default): prints old -> new
 *   npx medusa exec ./src/scripts/rename-a270-tube-skus.ts apply    # writes
 *
 * Idempotent: once renamed, a second run finds nothing to rename.
 * Writes go through core workflows, so product events still fire.
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  updateInventoryItemsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"

export const TUBE_HANDLE = "id-od-pol-tube-a270-3a-import"
/** The only A270 SKUs Sanitube still offers. */
export const A270_EXCEPTIONS = ["A270P-4100", "A270P-6050", "A270P-6075", "A270P-6100"]
const EXCLUDED_AI270 = ["AI270P-4402"]
const EXPECTED_WALL: Record<string, string> = {
  "AI270P-4400": '0.083"',
  "AI270P-61000": '0.120"',
  "AI270P-61200": '0.120"',
}

export const oldSkuFor = (a270: string) => a270.replace(/^A270/, "AI270")

type Variant = {
  id: string
  sku: string | null
  title: string | null
  metadata: Record<string, unknown> | null
  options?: Array<{ value: string; option?: { title?: string } | null }>
  inventory_items?: Array<{ inventory_item_id: string; inventory?: { id: string; sku: string | null } | null }>
  product?: { id: string; handle: string; title?: string } | null
}

export default async function renameA270TubeSkus({ container, args }: ExecArgs) {
  const apply = (args ?? []).includes("apply")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productModule = container.resolve(Modules.PRODUCT)

  const fields = [
    "id",
    "sku",
    "title",
    "metadata",
    "options.value",
    "options.option.title",
    "inventory_items.inventory_item_id",
    "inventory_items.inventory.id",
    "inventory_items.inventory.sku",
    "product.id",
    "product.handle",
    "product.title",
  ]

  const [product] = await productModule.listProducts({ handle: TUBE_HANDLE }, { select: ["id", "title"] })
  if (!product) {
    console.log(`No product with handle ${TUBE_HANDLE}; nothing to do.`)
    return
  }
  const { data: tubeVariants } = (await query.graph({
    entity: "variant",
    fields,
    filters: { product_id: product.id },
  })) as { data: Variant[] }
  const bySku = new Map(tubeVariants.map((v) => [v.sku ?? "", v]))

  console.log(`${apply ? "APPLY" : "DRY RUN"} — ${product.title} (${product.id}), ${tubeVariants.length} variants\n`)

  // ---- 1. Rename the four exceptions --------------------------------------
  const renames: Array<{ variant: Variant; from: string; to: string; inventoryItemId: string | null }> = []
  for (const to of A270_EXCEPTIONS) {
    const from = oldSkuFor(to)
    const current = bySku.get(from)
    const already = bySku.get(to)
    if (already && !current) {
      console.log(`  ${from.padEnd(14)} -> ${to.padEnd(12)} already renamed (${already.id})`)
      continue
    }
    if (already && current) {
      console.log(`  ${from.padEnd(14)} -> ${to.padEnd(12)} CONFLICT: both SKUs exist (${current.id}, ${already.id}); fix by hand`)
      continue
    }
    if (!current) {
      console.log(`  ${from.padEnd(14)} -> ${to.padEnd(12)} MISSING: no ${from} variant on the tube product`)
      continue
    }
    // Another product may already use the A270 SKU (SKUs are unique).
    const { data: clash } = (await query.graph({ entity: "variant", fields: ["id", "product.handle"], filters: { sku: to } })) as {
      data: Variant[]
    }
    if (clash.length) {
      console.log(`  ${from.padEnd(14)} -> ${to.padEnd(12)} CONFLICT: ${to} already used by ${clash[0].id} (${clash[0].product?.handle}); fix by hand`)
      continue
    }
    const linked = (current.inventory_items ?? []).find((i) => i.inventory?.sku === from)
    renames.push({ variant: current, from, to, inventoryItemId: linked?.inventory?.id ?? null })
    console.log(
      `  ${from.padEnd(14)} -> ${to.padEnd(12)} ${current.title ?? ""}` +
        `  (metadata.sanitube_sku ${JSON.stringify(current.metadata?.sanitube_sku ?? null)} -> "${to}"` +
        `${linked ? `; inventory item ${linked.inventory?.id} sku -> ${to}` : ""})`
    )
  }

  // ---- 1b. metadata.sanitube_sku on the AI270 variants ---------------------
  const metaFixes: Array<{ variant: Variant; from: unknown; to: string }> = []
  for (const v of tubeVariants) {
    const sku = v.sku ?? ""
    if (!/^AI270/i.test(sku)) continue
    if (A270_EXCEPTIONS.includes(sku.replace(/^AI270/i, "A270"))) continue // renamed above
    if (v.metadata?.sanitube_sku === sku) continue
    metaFixes.push({ variant: v, from: v.metadata?.sanitube_sku ?? null, to: sku })
  }
  if (metaFixes.length) {
    console.log(`\nmetadata.sanitube_sku corrections (${metaFixes.length}):`)
    for (const f of metaFixes) {
      console.log(`  ${(f.variant.sku ?? "").padEnd(14)} sanitube_sku ${JSON.stringify(f.from)} -> "${f.to}"`)
    }
  }

  // ---- 2. Report what Sanitube no longer offers ---------------------------
  console.log("\nChecks (report only, nothing is changed):")
  const { data: a270Variants } = (await query.graph({
    entity: "variant",
    fields: ["id", "sku", "title", "product.handle"],
    filters: { sku: { $ilike: "A270%" } },
  })) as { data: Variant[] }
  const strayA270 = a270Variants.filter((v) => !A270_EXCEPTIONS.includes((v.sku ?? "").toUpperCase()))
  if (strayA270.length) {
    for (const v of strayA270) {
      console.log(`  FOUND excluded A270 SKU ${v.sku} (${v.id}, product ${v.product?.handle}); Sanitube no longer offers it`)
    }
  } else {
    console.log("  OK: no A270 SKUs other than the four exceptions")
  }

  const { data: excluded } = (await query.graph({
    entity: "variant",
    fields: ["id", "sku", "product.handle"],
    filters: { sku: EXCLUDED_AI270 },
  })) as { data: Variant[] }
  if (excluded.length) {
    for (const v of excluded) {
      console.log(`  FOUND ${v.sku} (${v.id}, product ${v.product?.handle}); 0.065" wall, not stocked, excluded`)
    }
  } else {
    console.log(`  OK: ${EXCLUDED_AI270.join(", ")} does not exist`)
  }

  for (const [sku, wall] of Object.entries(EXPECTED_WALL)) {
    const v = bySku.get(sku)
    if (!v) {
      console.log(`  NOTE: ${sku} not on the tube product`)
      continue
    }
    const actual = (v.options ?? []).find((o) => o.option?.title === "Wall")?.value
    console.log(
      actual === wall
        ? `  OK: ${sku} Wall option is ${wall}`
        : `  MISMATCH: ${sku} Wall option is ${actual ?? "(none)"}, Sanitube says ${wall} (variant title: ${v.title})`
    )
  }

  console.log(`\n${renames.length} variant(s) to rename, ${metaFixes.length} sanitube_sku metadata correction(s).`)
  if (!apply) {
    console.log("Dry run only. Re-run with `apply` to write.")
    return
  }
  if (!renames.length && !metaFixes.length) return

  // ---- 3. Write -----------------------------------------------------------
  for (const r of renames) {
    await updateProductVariantsWorkflow(container).run({
      input: {
        selector: { id: r.variant.id },
        update: { sku: r.to, metadata: { ...(r.variant.metadata ?? {}), sanitube_sku: r.to } },
      },
    })
    if (r.inventoryItemId) {
      await updateInventoryItemsWorkflow(container).run({
        input: { updates: [{ id: r.inventoryItemId, sku: r.to }] },
      })
    }
    console.log(`  renamed ${r.from} -> ${r.to}`)
  }
  for (const f of metaFixes) {
    await updateProductVariantsWorkflow(container).run({
      input: {
        selector: { id: f.variant.id },
        update: { metadata: { ...(f.variant.metadata ?? {}), sanitube_sku: f.to } },
      },
    })
  }
  if (metaFixes.length) console.log(`  corrected sanitube_sku on ${metaFixes.length} variant(s)`)
  console.log("Done.")
}
