// POST /webhooks/inventory-sync
//
// Receives the SAME per-warehouse payload the QuickBooks Desktop VM sends to
// Sanitube ({ updates: [{ sku, kc?, la? }] }) and mirrors it into Cardinal.
// Cardinal is a single sellable-location store, so it SUMS kc + la and writes
// that combined total to the stock location linked to the store's default
// sales channel.
//
// SKUs match Sanitube 1:1 (e.g. "13H-100"). Cardinal carries only a subset, so
// SKUs with no matching variant are returned in `unknown_skus`, not failed.
//
// Counts are ABSOLUTE — stocked_quantity is SET, not incremented. Idempotent.
// Authenticated by a shared bearer token (CARDINAL_INVENTORY_SYNC_TOKEN) in the
// root middlewares.
//
// Response: { ok, updated, unknown_skus, errors }

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/core-flows"
import type { InventorySyncType } from "./validators"

export const POST = async (
  req: MedusaRequest<InventorySyncType>,
  res: MedusaResponse,
) => {
  const { updates } = req.validatedBody
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const productService = req.scope.resolve(Modules.PRODUCT)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)
  const storeService = req.scope.resolve(Modules.STORE)

  // Resolve Cardinal's sellable location: the stock_location linked to the
  // store's default sales channel. Cardinal runs single-location.
  const [store] = await storeService.listStores()
  const defaultChannelId = store?.default_sales_channel_id
  if (!defaultChannelId) {
    logger.error("[inventory-sync] Store has no default sales channel")
    res.status(500).json({ ok: false, message: "No default sales channel configured." })
    return
  }

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "stock_locations.id", "stock_locations.name"],
    filters: { id: defaultChannelId },
  })
  const locations = (channels?.[0]?.stock_locations ?? []) as Array<{
    id: string
    name?: string
  }>
  if (!locations.length) {
    logger.error("[inventory-sync] Default sales channel has no stock location")
    res.status(500).json({ ok: false, message: "No sellable stock location configured." })
    return
  }
  const sellable = locations[0]
  if (locations.length > 1) {
    logger.warn(
      `[inventory-sync] ${locations.length} stock locations on default channel; writing total to "${sellable.name ?? sellable.id}"`,
    )
  }

  let updated = 0
  const unknown_skus: string[] = []
  const errors: Array<{ sku: string; message: string }> = []

  for (const row of updates) {
    try {
      const total = (row.kc ?? 0) + (row.la ?? 0)

      const variants = await productService.listProductVariants(
        { sku: row.sku },
        { select: ["id", "sku", "manage_inventory"], take: 1 },
      )
      const variant = variants[0]
      if (!variant) {
        unknown_skus.push(row.sku)
        continue
      }

      // Ensure an inventory_item exists for this SKU and is linked.
      const existingItems = await inventoryService.listInventoryItems(
        { sku: row.sku },
        { take: 1 },
      )
      let inventoryItemId: string
      if (existingItems.length) {
        inventoryItemId = existingItems[0].id
      } else {
        const { result } = await createInventoryItemsWorkflow(req.scope).run({
          input: { items: [{ sku: row.sku, requires_shipping: true }] },
        })
        inventoryItemId = result[0].id
        await link.create({
          [Modules.PRODUCT]: { variant_id: variant.id },
          [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
          data: { required_quantity: 1 },
        })
      }

      if (!variant.manage_inventory) {
        await updateProductVariantsWorkflow(req.scope).run({
          input: { selector: { id: variant.id }, update: { manage_inventory: true } },
        })
      }

      // Upsert the single sellable level = kc + la.
      const existingLevels = await inventoryService.listInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: sellable.id,
      })
      if (existingLevels.length) {
        if (existingLevels[0].stocked_quantity !== total) {
          await updateInventoryLevelsWorkflow(req.scope).run({
            input: {
              updates: [
                {
                  inventory_item_id: inventoryItemId,
                  location_id: sellable.id,
                  stocked_quantity: total,
                },
              ],
            },
          })
        }
      } else {
        await createInventoryLevelsWorkflow(req.scope).run({
          input: {
            inventory_levels: [
              {
                inventory_item_id: inventoryItemId,
                location_id: sellable.id,
                stocked_quantity: total,
              },
            ],
          },
        })
      }

      updated++
    } catch (err) {
      errors.push({ sku: row.sku, message: (err as Error).message })
    }
  }

  logger.info(
    `[inventory-sync] updated=${updated} unknown=${unknown_skus.length} errors=${errors.length}`,
  )

  res.status(200).json({ ok: true, updated, unknown_skus, errors })
}
