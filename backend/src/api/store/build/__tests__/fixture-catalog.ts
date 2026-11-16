// The 345 real variants from the live store (backend/src/scripts/data/builder-seed-catalog.json)
// as a resolver Catalog, so the unit specs price against real SKUs, prices, weights and stock.
import seed from "../../../../scripts/data/builder-seed-catalog.json"
import type { Catalog, VariantFacts } from "../lib/resolver"

type SeedVariant = {
  sku: string
  price: number
  weight: number | null
  inventory_quantity: number | null
  manage_inventory: boolean
}

export function fixtureCatalog(overrides: Record<string, Partial<VariantFacts>> = {}): Map<string, VariantFacts> {
  const out = new Map<string, VariantFacts>()
  for (const v of (seed as { variants: SeedVariant[] }).variants) {
    out.set(v.sku, {
      sku: v.sku,
      variant_id: `variant_${v.sku}`,
      published: true,
      unit_price: v.price,
      weight_lb: v.weight,
      manage_inventory: v.manage_inventory,
      stock_qty: v.manage_inventory ? v.inventory_quantity ?? 0 : null,
    })
  }
  for (const [sku, patch] of Object.entries(overrides)) {
    const cur = out.get(sku)
    out.set(sku, { ...(cur as VariantFacts), sku, variant_id: `variant_${sku}`, ...patch } as VariantFacts)
  }
  return out
}

export const asCatalog = (m: Map<string, VariantFacts>): Catalog => m
