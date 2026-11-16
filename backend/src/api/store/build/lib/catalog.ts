// Loads the catalog facts the resolver needs, for a list of candidate SKUs, priced for the
// caller's basis (B2): list price in the US region, or the Company's Customer Group price list.

import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  getVariantAvailability,
  getTotalVariantAvailability,
  Modules,
  QueryContext,
} from "@medusajs/framework/utils"
import type { Catalog, VariantFacts } from "./resolver"

export type StoreContext = {
  region_id: string
  currency_code: string
  sales_channel_id: string | null
}

/* BUILD_RESOLVE_CACHE=off disables the in-memory caches (integration specs reseed between tests). */
export const cachingEnabled = () => process.env.BUILD_RESOLVE_CACHE !== "off"

let storeContextCache: { value: StoreContext; at: number } | null = null
const STORE_CONTEXT_TTL_MS = 5 * 60 * 1000

/** The US region (currency usd) and the store's default sales channel. */
export async function loadStoreContext(container: MedusaContainer): Promise<StoreContext> {
  if (cachingEnabled() && storeContextCache && Date.now() - storeContextCache.at < STORE_CONTEXT_TTL_MS) {
    return storeContextCache.value
  }
  const regionModule = container.resolve(Modules.REGION)
  const storeModule = container.resolve(Modules.STORE)
  const regions = await regionModule.listRegions({}, { relations: ["countries"] })
  const region =
    regions.find((r: any) => (r.countries ?? []).some((c: any) => c.iso_2 === "us")) ??
    regions.find((r: any) => r.currency_code === "usd") ??
    regions[0]
  if (!region) throw new Error("No region is configured")
  const [store] = await storeModule.listStores()
  const value = {
    region_id: region.id,
    currency_code: region.currency_code,
    sales_channel_id: store?.default_sales_channel_id ?? null,
  }
  storeContextCache = { value, at: Date.now() }
  return value
}

/** Test seam: forget the cached region/sales channel. */
export function resetStoreContextCache() {
  storeContextCache = null
}

export async function loadCatalog(
  container: MedusaContainer,
  skus: string[],
  ctx: StoreContext & { customer_group_id: string | null }
): Promise<Catalog> {
  const out = new Map<string, VariantFacts>()
  if (!skus.length) return out
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const pricing: Record<string, unknown> = { region_id: ctx.region_id, currency_code: ctx.currency_code }
  if (ctx.customer_group_id) pricing.customer = { groups: [{ id: ctx.customer_group_id }] }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "sku",
      "weight",
      "manage_inventory",
      "deleted_at",
      "product.id",
      "product.status",
      "product.deleted_at",
      "calculated_price.calculated_amount",
    ],
    filters: { sku: skus },
    context: { calculated_price: QueryContext(pricing) },
  })

  const ids = (variants as any[]).map((v) => v.id)
  const availability: Record<string, { availability: number }> = ids.length
    ? ctx.sales_channel_id
      ? await getVariantAvailability(query, { variant_ids: ids, sales_channel_id: ctx.sales_channel_id })
      : await getTotalVariantAvailability(query, { variant_ids: ids })
    : {}

  for (const v of variants as any[]) {
    if (!v.sku || out.has(v.sku)) continue
    const amount = v.calculated_price?.calculated_amount
    const weight = v.weight === null || v.weight === undefined ? null : Number(v.weight)
    out.set(v.sku, {
      sku: v.sku,
      variant_id: v.id,
      published: v.product?.status === "published" && !v.deleted_at && !v.product?.deleted_at,
      unit_price: amount === null || amount === undefined ? null : Number(amount),
      weight_lb: weight !== null && Number.isFinite(weight) ? weight : null,
      manage_inventory: !!v.manage_inventory,
      stock_qty: availability[v.id] ? Number(availability[v.id].availability) : v.manage_inventory ? 0 : null,
    })
  }
  return out
}
