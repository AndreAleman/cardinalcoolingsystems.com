import { z } from "zod"

export const AdminListBuildConfigurations = z
  .object({
    builder_type: z.enum(["cdu-kit", "row-manifold", "transition", "strainer", "hose"]).optional(),
    pricing_mode: z.enum(["instant", "quote"]).optional(),
    /** Demand (most resolved first) or recency (last resolved first). */
    sort: z.enum(["resolve_count", "recent"]).default("resolve_count"),
    limit: z.coerce.number().int().min(1).max(200).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .strict()
export type AdminListBuildConfigurationsType = z.infer<typeof AdminListBuildConfigurations>
