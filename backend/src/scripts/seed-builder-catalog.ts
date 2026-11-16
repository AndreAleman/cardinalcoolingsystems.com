/*
  LOCAL ONLY. Seeds the Cardinal Builder catalog fixture
  (data/builder-seed-catalog.json: 345 real variants from the live store,
  2026-10-18) into a local database, with list prices, weights and stock,
  so /store/build/resolve and /store/build/quote-lines can be exercised.

    npx medusa exec ./src/scripts/seed-builder-catalog.ts

  Refuses to run unless DATABASE_URL points at localhost / 127.0.0.1.
  Idempotent: products whose handle already exists are skipped. Creates
  (when missing) a US region, a default sales channel, a stock location
  linked to it and a publishable key, and prints the key.

  The integration specs reuse seedBuilderCatalog() with a SKU subset.
*/
import type { ExecArgs, MedusaContainer } from "@medusajs/framework/types";
import {
  ApiKeyType,
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";
import seed from "./data/builder-seed-catalog.json";

type SeedVariant = {
  sku: string;
  product_title: string;
  handle: string;
  options: string[];
  price: number;
  weight: number | null;
  inventory_quantity: number | null;
  manage_inventory: boolean;
};

export const BUILDER_SEED_VARIANTS = (seed as { variants: SeedVariant[] }).variants;

/** True only for a local Postgres URL. */
export function isLocalDatabaseUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const host = new URL(url).hostname.replace(/^\[|\]$/g, "");
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export type SeedWorld = { region_id: string; sales_channel_id: string; stock_location_id: string };

/** Region (US/usd), default sales channel and a stock location linked to it — created when missing. */
export async function ensureBuilderWorld(container: MedusaContainer): Promise<SeedWorld> {
  const regionModule = container.resolve(Modules.REGION);
  const storeModule = container.resolve(Modules.STORE);
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL);
  const stockLocationModule = container.resolve(Modules.STOCK_LOCATION);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  let [region] = await regionModule.listRegions({ currency_code: "usd" });
  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: { regions: [{ name: "US", currency_code: "usd", countries: ["us"] }] },
    });
    region = result[0] as any;
  }

  let [store] = await storeModule.listStores();
  let salesChannelId = store?.default_sales_channel_id ?? null;
  if (!salesChannelId) {
    const [existing] = await salesChannelModule.listSalesChannels({});
    salesChannelId =
      existing?.id ??
      (
        await createSalesChannelsWorkflow(container).run({
          input: { salesChannelsData: [{ name: "Default Sales Channel" }] },
        })
      ).result[0].id;
    if (!store) {
      store = await storeModule.createStores({
        name: "Cardinal (local)",
        supported_currencies: [{ currency_code: "usd", is_default: true }],
      });
    }
    await updateStoresWorkflow(container).run({
      input: { selector: { id: store.id }, update: { default_sales_channel_id: salesChannelId } },
    });
  }

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "stock_locations.id"],
    filters: { id: salesChannelId },
  });
  let locationId = (channels?.[0] as any)?.stock_locations?.[0]?.id as string | undefined;
  if (!locationId) {
    const [anyLocation] = await stockLocationModule.listStockLocations({});
    locationId =
      anyLocation?.id ??
      (
        await createStockLocationsWorkflow(container).run({
          input: { locations: [{ name: "Miami (local)" }] },
        })
      ).result[0].id;
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: locationId as string, add: [salesChannelId] },
    });
  }

  return { region_id: region.id, sales_channel_id: salesChannelId, stock_location_id: locationId as string };
}

/**
 * Creates one product per fixture handle (one "Part" option, one value per SKU) with list
 * prices, weights and stock. `skus` limits the seed to those variants (integration specs).
 * Returns variant ids by SKU.
 */
export async function seedBuilderCatalog(
  container: MedusaContainer,
  opts: { skus?: string[]; world?: SeedWorld } = {}
): Promise<{ world: SeedWorld; variantIdBySku: Record<string, string>; created: number }> {
  const world = opts.world ?? (await ensureBuilderWorld(container));
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT);
  const [shippingProfile] = await fulfillmentModule.listShippingProfiles({});

  const wanted = opts.skus ? new Set(opts.skus) : null;
  const rows = BUILDER_SEED_VARIANTS.filter((v) => !wanted || wanted.has(v.sku));
  const byHandle = new Map<string, SeedVariant[]>();
  for (const v of rows) byHandle.set(v.handle, [...(byHandle.get(v.handle) ?? []), v]);

  const { data: existing } = await query.graph({
    entity: "product",
    fields: ["handle"],
    filters: { handle: [...byHandle.keys()] },
  });
  const existingHandles = new Set((existing as any[]).map((p) => p.handle));

  const products = [...byHandle.entries()]
    .filter(([handle]) => !existingHandles.has(handle))
    .map(([handle, variants]) => ({
      title: variants[0].product_title,
      handle,
      status: ProductStatus.PUBLISHED,
      ...(shippingProfile ? { shipping_profile_id: shippingProfile.id } : {}),
      sales_channels: [{ id: world.sales_channel_id }],
      options: [{ title: "Part", values: variants.map((v) => v.sku) }],
      variants: variants.map((v) => ({
        title: v.options.join(" / ") || v.sku,
        sku: v.sku,
        ...(v.weight !== null ? { weight: v.weight } : {}),
        manage_inventory: v.manage_inventory,
        prices: [{ currency_code: "usd", amount: v.price }],
        options: { Part: v.sku },
      })),
    }));

  if (products.length) {
    await createProductsWorkflow(container).run({ input: { products: products as any } });
  }

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "sku", "inventory_items.inventory_item_id", "inventory_items.inventory.location_levels.location_id"],
    filters: { sku: rows.map((r) => r.sku) },
  });
  const seedBySku = new Map(rows.map((r) => [r.sku, r]));
  const levels: { inventory_item_id: string; location_id: string; stocked_quantity: number }[] = [];
  const variantIdBySku: Record<string, string> = {};
  for (const v of variants as any[]) {
    variantIdBySku[v.sku] = v.id;
    const s = seedBySku.get(v.sku);
    if (!s?.manage_inventory) continue;
    for (const link of v.inventory_items ?? []) {
      const has = (link.inventory?.location_levels ?? []).some((l: any) => l.location_id === world.stock_location_id);
      if (!has && link.inventory_item_id) {
        levels.push({
          inventory_item_id: link.inventory_item_id,
          location_id: world.stock_location_id,
          stocked_quantity: Math.max(0, s.inventory_quantity ?? 0),
        });
      }
    }
  }
  if (levels.length) {
    await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: levels } });
  }

  return { world, variantIdBySku, created: products.length };
}

export default async function seedBuilderCatalogScript({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  if (!isLocalDatabaseUrl(process.env.DATABASE_URL)) {
    logger.error("[seed-builder-catalog] Refusing to run: DATABASE_URL is not localhost / 127.0.0.1.");
    process.exitCode = 1;
    return;
  }

  const { world, variantIdBySku, created } = await seedBuilderCatalog(container);
  logger.info(
    `[seed-builder-catalog] ${created} products created; ${Object.keys(variantIdBySku).length} fixture variants present.`
  );

  const apiKeyModule = container.resolve(Modules.API_KEY);
  let [key] = await apiKeyModule.listApiKeys({ type: ApiKeyType.PUBLISHABLE, title: "Builder (local)" });
  if (!key) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: { api_keys: [{ title: "Builder (local)", type: ApiKeyType.PUBLISHABLE, created_by: "seed-builder-catalog" }] },
    });
    key = result[0] as any;
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: key.id, add: [world.sales_channel_id] },
    });
  }
  logger.info(`[seed-builder-catalog] publishable key: ${key.token}`);
}
