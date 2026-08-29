// POST /webhooks/quickbooks-inventory
//
// Receives per-warehouse stock counts from the SaniTube QuickBooks Desktop VM
// and mirrors them into Medusa inventory_levels. Authenticated by a shared
// bearer token (QB_INVENTORY_SYNC_TOKEN) in this folder's middleware.
//
// Body: { updates: [{ sku, kc?, la? }] }
//   kc → "Kansas City" stock location   la → "Paramount" stock location
//
// Counts are ABSOLUTE — stocked_quantity is SET, not incremented. Omitting kc
// or la leaves that warehouse untouched. The dashboard will combine the two
// locations into one customer-facing availability number. SKUs with no match
// are reported in `unknown_skus` rather than failing the whole batch.
//
// Response: { ok, updated, unknown_skus, errors }

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  createInventoryItemsWorkflow,
  createInventoryLevelsWorkflow,
  updateInventoryLevelsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import type { QbInventorySyncType } from "./validators"

export const POST = async (
  req: MedusaRequest<QbInventorySyncType>,
  res: MedusaResponse,
) => {
  const { updates } = req.validatedBody
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)
  const stockLocationService = req.scope.resolve(Modules.STOCK_LOCATION)
  const productService = req.scope.resolve(Modules.PRODUCT)
  const inventoryService = req.scope.resolve(Modules.INVENTORY)

  // Resolve the two SaniTube warehouses once.
  const allLocations = await stockLocationService.listStockLocations({})
  const kc = allLocations.find((location) => location.name === "Kansas City")
  const paramount = allLocations.find((location) => location.name === "Paramount")
  if (!kc || !paramount) {
    logger.error(
      '[qb-inventory] Missing stock locations "Kansas City" / "Paramount"',
    )
    res.status(500).json({
      ok: false,
      message:
        'Warehouses not configured. Both "Kansas City" and "Paramount" stock locations must exist.',
    })
    return
  }

  let updated = 0
  const unknown_skus: string[] = []
  const errors: Array<{ sku: string; message: string }> = []

  for (const row of updates) {
    try {
      const variants = await productService.listProductVariants(
        { sku: row.sku },
        { select: ["id", "sku", "manage_inventory"], take: 1 },
      )
      const variant = variants[0]
      if (!variant) {
        unknown_skus.push(row.sku)
        continue
      }

      // Step 1: ensure an inventory_item exists for this SKU and is linked.
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

      // Step 2: manage_inventory must be on for levels to gate checkout.
      if (!variant.manage_inventory) {
        await updateProductVariantsWorkflow(req.scope).run({
          input: { selector: { id: variant.id }, update: { manage_inventory: true } },
        })
      }

      // Step 3: upsert only the warehouse levels QuickBooks supplied.
      const targets: Array<{ locationId: string; qty: number }> = []
      if (row.kc !== undefined) targets.push({ locationId: kc.id, qty: row.kc })
      if (row.la !== undefined) targets.push({ locationId: paramount.id, qty: row.la })
      for (const target of targets) {
        const existingLevels = await inventoryService.listInventoryLevels({
          inventory_item_id: inventoryItemId,
          location_id: target.locationId,
        })
        if (existingLevels.length) {
          if (existingLevels[0].stocked_quantity !== target.qty) {
            await updateInventoryLevelsWorkflow(req.scope).run({
              input: {
                updates: [
                  {
                    inventory_item_id: inventoryItemId,
                    location_id: target.locationId,
                    stocked_quantity: target.qty,
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
                  location_id: target.locationId,
                  stocked_quantity: target.qty,
                },
              ],
            },
          })
        }
      }

      updated++
    } catch (err) {
      errors.push({ sku: row.sku, message: (err as Error).message })
    }
  }

  logger.info(
    `[qb-inventory] updated=${updated} unknown=${unknown_skus.length} errors=${errors.length}`,
  )

  res.status(200).json({ ok: true, updated, unknown_skus, errors })
}
