// Adds SaniTube's MANUAL clamp (tri-clamp) butterfly valves, which the WC bulk
// migration skipped (WC parent TCBFN mixes "Size" and "Size (Tube OD)"
// attributes; SaniTube's own backend imported it separately in
// import-19wb-tcbfn.ts). Generated data — see the PR for sources.
//
//   1. "Clamp Butterfly Valve T316 with Pull Handle" (published)
//      EPDM seat TCBFN6-###, Viton seat TCBFV-### (QuickBooks SKU; SaniTube's
//      web store calls it TCBFV6-###, kept in variant metadata.sanitube_web_sku)
//   2. "Clamp Butterfly Valve T304 with Silicone Seat & Trigger Handle"
//      TCBFS4-### — created as DRAFT: price + weight are estimates, publish in
//      the admin after confirming them.
//
// Prices = SaniTube WC net price x 2.2 (this store's rule for every other
// migrated SKU). Weight = WC weight rounded up (store convention).
//
// Placement (categories, collection, sales channels, shipping profile) is
// copied from the existing actuated clamp butterfly valve product so the new
// products sit right next to it.
//
// Idempotent: products whose handle already exists are skipped; an existing
// inventory item with the same SKU is linked instead of duplicated.
//
// Dry run (default):  npx medusa exec ./src/scripts/import-clamp-butterfly-valves.ts
// Write:              npx medusa exec ./src/scripts/import-clamp-butterfly-valves.ts apply
// Optional env: MANAGE_INVENTORY=false  (orderable before the stock feed covers the SKUs)

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"

type VariantSeed = {
  title: string
  sku: string
  options: Record<string, string>
  price: number
  weight: number
  length: number
  width: number
  height: number
  metadata: Record<string, unknown>
}

type ProductSeed = {
  title: string
  handle: string
  status: "published" | "draft"
  description: string
  image: string
  metadata: Record<string, unknown>
  variants: VariantSeed[]
}

const SIBLING_HANDLES = [
  "clamp-butterfly-valve-t316l-with-spring-return-actuator-nc-epdm-seat",
  "weld-end-butterfly-valve-epdm-seat-316",
]

const PRODUCTS: ProductSeed[] = [
  {
    "title": "Clamp Butterfly Valve T316 with Pull Handle",
    "handle": "clamp-butterfly-valve",
    "status": "published",
    "description": "The Cardinal Cooling Systems Clamp Butterfly Valve is a manual quarter-turn shut-off valve with tri-clamp ends on both sides, built for sanitary process lines and liquid cooling loops where fast installation and easy cleaning matter.\n\nThe body, disc and stem are T316 stainless steel, and all wetted surfaces are sanitary finished to under 32 Ra. The pinless disc leaves no crevices in the flow path, and the valve is field serviceable: seats and stem bushings can be replaced without cutting the line.\n\nChoose an EPDM seat for water, glycol and most CIP chemistry, or a Viton seat for oils and hydrocarbons (check seat compatibility with your media).\n\nPressure rating: 145 PSI for 1\" to 4\", 60 PSI for 6\" and 8\" (water at 68°F). Available in 1\", 1-1/2\", 2\", 2-1/2\", 3\", 4\", 6\" and 8\" tube OD.",
    "metadata": {
      "meta_title": "Clamp Butterfly Valve 316 | EPDM or Viton Seat",
      "meta_description": "Tri-clamp butterfly valve in T316 stainless with pull handle. EPDM or Viton seat, 1\" to 8\" tube OD, sanitary finish, field serviceable.",
      "requires_quote": false,
      "woocommerce_id": 1009,
      "parent_sku": "TCBFN"
    },
    "image": "https://bucket-production-02b9.up.railway.app/medusa-media/TCBFE-01KEN6DSFNY19HXV9S97V7F1FE.jpg",
    "variants": [
      {
        "title": "T316, 1\", EPDM",
        "sku": "TCBFN6-100",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "1\"",
          "Seat": "EPDM"
        },
        "price": 148.65,
        "weight": 3,
        "length": 7,
        "width": 4,
        "height": 3,
        "metadata": {
          "woocommerce_id": 12706
        }
      },
      {
        "title": "T316, 1-1/2\", EPDM",
        "sku": "TCBFN6-150",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "1-1/2\"",
          "Seat": "EPDM"
        },
        "price": 143.81,
        "weight": 3,
        "length": 8,
        "width": 4,
        "height": 5,
        "metadata": {
          "woocommerce_id": 12707
        }
      },
      {
        "title": "T316, 2\", EPDM",
        "sku": "TCBFN6-200",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "2\"",
          "Seat": "EPDM"
        },
        "price": 178.55,
        "weight": 4,
        "length": 8,
        "width": 4,
        "height": 6,
        "metadata": {
          "woocommerce_id": 12708
        }
      },
      {
        "title": "T316, 2-1/2\", EPDM",
        "sku": "TCBFN6-250",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "2-1/2\"",
          "Seat": "EPDM"
        },
        "price": 209.51,
        "weight": 4,
        "length": 8,
        "width": 5,
        "height": 6,
        "metadata": {
          "woocommerce_id": 12709
        }
      },
      {
        "title": "T316, 3\", EPDM",
        "sku": "TCBFN6-300",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "3\"",
          "Seat": "EPDM"
        },
        "price": 274.3,
        "weight": 5,
        "length": 10,
        "width": 6,
        "height": 5,
        "metadata": {
          "woocommerce_id": 12710
        }
      },
      {
        "title": "T316, 4\", EPDM",
        "sku": "TCBFN6-400",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "4\"",
          "Seat": "EPDM"
        },
        "price": 438.44,
        "weight": 9,
        "length": 10,
        "width": 7,
        "height": 6,
        "metadata": {
          "woocommerce_id": 12711
        }
      },
      {
        "title": "T316, 6\", EPDM",
        "sku": "TCBFN6-600",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "6\"",
          "Seat": "EPDM"
        },
        "price": 936.87,
        "weight": 19,
        "length": 17,
        "width": 9,
        "height": 10,
        "metadata": {
          "woocommerce_id": 12712
        }
      },
      {
        "title": "T316, 8\", EPDM",
        "sku": "TCBFN6-800",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "8\"",
          "Seat": "EPDM"
        },
        "price": 1993.57,
        "weight": 24,
        "length": 17,
        "width": 11,
        "height": 10,
        "metadata": {
          "woocommerce_id": 12713
        }
      },
      {
        "title": "T316, 1\", Viton",
        "sku": "TCBFV-100",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "1\"",
          "Seat": "Viton"
        },
        "price": 166.06,
        "weight": 3,
        "length": 7,
        "width": 4,
        "height": 3,
        "metadata": {
          "woocommerce_id": 12714,
          "sanitube_web_sku": "TCBFV6-100"
        }
      },
      {
        "title": "T316, 1-1/2\", Viton",
        "sku": "TCBFV-150",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "1-1/2\"",
          "Seat": "Viton"
        },
        "price": 168.96,
        "weight": 3,
        "length": 8,
        "width": 4,
        "height": 5,
        "metadata": {
          "woocommerce_id": 12715,
          "sanitube_web_sku": "TCBFV6-150"
        }
      },
      {
        "title": "T316, 2\", Viton",
        "sku": "TCBFV-200",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "2\"",
          "Seat": "Viton"
        },
        "price": 210.12,
        "weight": 4,
        "length": 8,
        "width": 4,
        "height": 6,
        "metadata": {
          "woocommerce_id": 12716,
          "sanitube_web_sku": "TCBFV6-200"
        }
      },
      {
        "title": "T316, 2-1/2\", Viton",
        "sku": "TCBFV-250",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "2-1/2\"",
          "Seat": "Viton"
        },
        "price": 287.36,
        "weight": 4,
        "length": 8,
        "width": 5,
        "height": 6,
        "metadata": {
          "woocommerce_id": 12717,
          "sanitube_web_sku": "TCBFV6-250"
        }
      },
      {
        "title": "T316, 3\", Viton",
        "sku": "TCBFV-300",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "3\"",
          "Seat": "Viton"
        },
        "price": 397.01,
        "weight": 5,
        "length": 10,
        "width": 6,
        "height": 5,
        "metadata": {
          "woocommerce_id": 12718,
          "sanitube_web_sku": "TCBFV6-300"
        }
      },
      {
        "title": "T316, 4\", Viton",
        "sku": "TCBFV-400",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "4\"",
          "Seat": "Viton"
        },
        "price": 649.18,
        "weight": 9,
        "length": 10,
        "width": 7,
        "height": 6,
        "metadata": {
          "woocommerce_id": 12719,
          "sanitube_web_sku": "TCBFV6-400"
        }
      },
      {
        "title": "T316, 6\", Viton",
        "sku": "TCBFV-600",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "6\"",
          "Seat": "Viton"
        },
        "price": 1409.72,
        "weight": 19,
        "length": 17,
        "width": 9,
        "height": 10,
        "metadata": {
          "woocommerce_id": 12720,
          "sanitube_web_sku": "TCBFV6-600"
        }
      },
      {
        "title": "T316, 8\", Viton",
        "sku": "TCBFV-800",
        "options": {
          "Alloy": "T316",
          "Size (Tube OD)": "8\"",
          "Seat": "Viton"
        },
        "price": 0.0,
        "weight": 24,
        "length": 17,
        "width": 11,
        "height": 10,
        "metadata": {
          "woocommerce_id": 12721,
          "sanitube_web_sku": "TCBFV6-800"
        }
      }
    ]
  },
  {
    "title": "Clamp Butterfly Valve T304 with Silicone Seat & Trigger Handle",
    "handle": "clamp-butterfly-valve-304-silicone-seat-trigger-handle",
    "status": "draft",
    "description": "The Cardinal Cooling Systems T304 Clamp Butterfly Valve is an economical manual shut-off valve with tri-clamp ends, a silicone seat and a blue squeeze-trigger handle that locks the disc in position.\n\nThe T304 stainless body and pinless disc give a smooth, cleanable flow path for water, cooling and general sanitary service, and the clamp ends let you install or remove the valve without welding.\n\nAvailable in 1\", 1-1/2\", 2\", 2-1/2\", 3\" and 4\" tube OD.",
    "metadata": {
      "meta_title": "Clamp Butterfly Valve 304 | Silicone Seat, Trigger Handle",
      "meta_description": "Tri-clamp butterfly valve in T304 stainless with silicone seat and blue trigger handle. 1\" to 4\" tube OD, clamp ends for weld-free install.",
      "requires_quote": false,
      "parent_sku": "TCBFS4"
    },
    "image": "https://bucket-production-02b9.up.railway.app/medusa-media/TCBFN-01KEN6DSFNPZXK1P57MZ764FB7.jpg",
    "variants": [
      {
        "title": "T304, 1\", Silicone",
        "sku": "TCBFS4-100",
        "options": {
          "Alloy": "T304",
          "Size (Tube OD)": "1\"",
          "Seat": "Silicone"
        },
        "price": 103.29,
        "weight": 3,
        "length": 7,
        "width": 4,
        "height": 3,
        "metadata": {}
      },
      {
        "title": "T304, 1-1/2\", Silicone",
        "sku": "TCBFS4-150",
        "options": {
          "Alloy": "T304",
          "Size (Tube OD)": "1-1/2\"",
          "Seat": "Silicone"
        },
        "price": 103.29,
        "weight": 3,
        "length": 8,
        "width": 4,
        "height": 5,
        "metadata": {}
      },
      {
        "title": "T304, 2\", Silicone",
        "sku": "TCBFS4-200",
        "options": {
          "Alloy": "T304",
          "Size (Tube OD)": "2\"",
          "Seat": "Silicone"
        },
        "price": 121.13,
        "weight": 4,
        "length": 8,
        "width": 4,
        "height": 6,
        "metadata": {}
      },
      {
        "title": "T304, 2-1/2\", Silicone",
        "sku": "TCBFS4-250",
        "options": {
          "Alloy": "T304",
          "Size (Tube OD)": "2-1/2\"",
          "Seat": "Silicone"
        },
        "price": 164.36,
        "weight": 4,
        "length": 8,
        "width": 5,
        "height": 6,
        "metadata": {}
      },
      {
        "title": "T304, 3\", Silicone",
        "sku": "TCBFS4-300",
        "options": {
          "Alloy": "T304",
          "Size (Tube OD)": "3\"",
          "Seat": "Silicone"
        },
        "price": 207.67,
        "weight": 5,
        "length": 10,
        "width": 6,
        "height": 5,
        "metadata": {}
      },
      {
        "title": "T304, 4\", Silicone",
        "sku": "TCBFS4-400",
        "options": {
          "Alloy": "T304",
          "Size (Tube OD)": "4\"",
          "Seat": "Silicone"
        },
        "price": 278.97,
        "weight": 9,
        "length": 10,
        "width": 7,
        "height": 6,
        "metadata": {}
      }
    ]
  }
]

export default async function importClampButterflyValves({ container, args }: ExecArgs) {
  const apply = (args ?? []).includes("apply")
  const manageInventory = process.env.MANAGE_INVENTORY !== "false"
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const productService = container.resolve(Modules.PRODUCT)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const fulfillmentService = container.resolve(Modules.FULFILLMENT)

  logger.info(`[clamp-bfv] mode=${apply ? "APPLY" : "DRY RUN"} manage_inventory=${manageInventory}`)

  // Placement template: the existing butterfly valve product.
  let sibling: any
  for (const handle of SIBLING_HANDLES) {
    const { data } = await query.graph({
      entity: "product",
      fields: ["id", "handle", "collection_id", "type_id", "categories.id", "categories.name",
        "sales_channels.id", "sales_channels.name", "shipping_profile.id", "shipping_profile.name"],
      filters: { handle },
    })
    if (data[0]) {
      sibling = data[0]
      break
    }
  }
  if (!sibling) throw new Error("No sibling butterfly valve product found — aborting")

  let shippingProfileId: string | undefined = sibling.shipping_profile?.id
  if (!shippingProfileId) {
    const [profile] = await fulfillmentService.listShippingProfiles({ type: "default" })
    shippingProfileId = profile?.id
  }
  if (!shippingProfileId) throw new Error("No shipping profile found — aborting")

  const categories = (sibling.categories ?? []).map((c: any) => ({ id: c.id }))
  const salesChannels = (sibling.sales_channels ?? []).map((s: any) => ({ id: s.id }))
  logger.info(
    `[clamp-bfv] template=${sibling.handle} categories=[${(sibling.categories ?? []).map((c: any) => c.name).join(", ")}] ` +
      `sales_channels=[${(sibling.sales_channels ?? []).map((s: any) => s.name).join(", ")}] ` +
      `shipping_profile=${shippingProfileId} collection=${sibling.collection_id ?? "-"}`,
  )
  if (!salesChannels.length) throw new Error("Template product has no sales channel — aborting")

  for (const seed of PRODUCTS) {
    const [existing] = await productService.listProducts({ handle: seed.handle }, { take: 1 })
    if (existing) {
      logger.info(`[clamp-bfv] = ${seed.handle} already exists (${existing.id}), skipping`)
      continue
    }

    const skus = seed.variants.map((v) => v.sku)
    const clashes = await productService.listProductVariants({ sku: skus }, { take: skus.length })
    if (clashes.length) {
      logger.warn(
        `[clamp-bfv] ! ${seed.handle}: SKU(s) already on another product: ${clashes.map((v) => v.sku).join(", ")} — skipping`,
      )
      continue
    }

    const existingItems = manageInventory
      ? await inventoryService.listInventoryItems({ sku: skus }, { take: skus.length })
      : []
    const itemBySku = new Map(existingItems.map((i) => [i.sku, i.id]))

    const optionValues = (title: string) => [...new Set(seed.variants.map((v) => v.options[title]))]
    const input = {
      title: seed.title,
      handle: seed.handle,
      status: seed.status,
      description: seed.description,
      thumbnail: seed.image,
      images: [{ url: seed.image }],
      metadata: seed.metadata,
      discountable: true,
      collection_id: sibling.collection_id ?? undefined,
      type_id: sibling.type_id ?? undefined,
      categories,
      sales_channels: salesChannels,
      shipping_profile_id: shippingProfileId,
      options: ["Alloy", "Size (Tube OD)", "Seat"].map((title) => ({ title, values: optionValues(title) })),
      variants: seed.variants.map((v, rank) => ({
        title: v.title,
        sku: v.sku,
        options: v.options,
        prices: [{ currency_code: "usd", amount: v.price }],
        weight: v.weight,
        length: v.length,
        width: v.width,
        height: v.height,
        manage_inventory: manageInventory,
        allow_backorder: false,
        variant_rank: rank,
        metadata: v.metadata,
        ...(itemBySku.has(v.sku)
          ? { inventory_items: [{ inventory_item_id: itemBySku.get(v.sku)!, required_quantity: 1 }] }
          : {}),
      })),
    }

    for (const v of seed.variants) {
      logger.info(
        `[clamp-bfv]   ${v.sku.padEnd(11)} ${v.title.padEnd(26)} $${v.price.toFixed(2).padStart(8)}  ${v.weight} lb` +
          (itemBySku.has(v.sku) ? "  (links existing inventory item)" : ""),
      )
    }

    if (!apply) {
      logger.info(`[clamp-bfv] would create ${seed.handle} [${seed.status}] with ${seed.variants.length} variants`)
      continue
    }

    const { result } = await createProductsWorkflow(container).run({ input: { products: [input as any] } })
    logger.info(`[clamp-bfv] + created ${seed.handle} (${result[0].id}) [${seed.status}] with ${seed.variants.length} variants`)
  }

  if (!apply) logger.info("[clamp-bfv] dry run only — re-run with the apply argument to write")
}
