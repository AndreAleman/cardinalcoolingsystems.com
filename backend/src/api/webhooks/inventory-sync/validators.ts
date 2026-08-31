import { z } from "zod"

export type InventorySyncType = z.infer<typeof InventorySync>

// Body for POST /webhooks/inventory-sync.
//
// Identical shape to the Sanitube QuickBooks payload so the QB VM can post the
// SAME body to both stores. Cardinal is single-location, so it sums kc + la
// into its one sellable location (see route.ts). Both fields are optional but
// each row must carry at least one.
export const InventorySync = z
  .object({
    updates: z
      .array(
        z
          .object({
            sku: z.string().trim().min(1).max(120),
            kc: z.number().int().min(0).max(10_000_000).optional(),
            la: z.number().int().min(0).max(10_000_000).optional(),
          })
          .strict()
          .refine((u) => u.kc !== undefined || u.la !== undefined, {
            message: 'Each update must include at least one of "kc" or "la".',
          }),
      )
      .min(1)
      .max(50_000),
  })
  .strict()
