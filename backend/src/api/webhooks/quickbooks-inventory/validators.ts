import { z } from "zod"

export type QbInventorySyncType = z.infer<typeof QbInventorySync>

// Body for POST /webhooks/quickbooks-inventory.
//
// `updates` is one entry per SKU. `kc` / `la` are ABSOLUTE per-warehouse
// counts (not deltas). Both are optional so a partial push leaves the
// omitted warehouse untouched, but each row must carry at least one.
export const QbInventorySync = z
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
          .refine((update) => update.kc !== undefined || update.la !== undefined, {
            message: 'Each update must include at least one of "kc" or "la".',
          }),
      )
      .min(1)
      .max(50_000),
  })
  .strict()
