import { z } from "zod"
import { BUILDER_TYPES } from "../../../lib/cpq-shared"

const optionValue = z.union([
  z.string().max(200),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.union([z.string().max(200), z.number()])).max(50),
])

/* Options are decoded forgivingly by the builder (invalid → default, reported in `ignored`),
   so the schema only bounds the shape. The builder_type check gives a clear 400. */
const builderType = z
  .string()
  .refine((t) => (BUILDER_TYPES as readonly string[]).includes(t), (t) => ({
    message: `Unknown builder_type "${t}". Expected one of: ${BUILDER_TYPES.join(", ")}`,
  }))

export const StoreBuildResolve = z.object({
  builder_type: builderType,
  options: z.record(optionValue).default({}),
})
export type StoreBuildResolveType = z.infer<typeof StoreBuildResolve>

export const StoreBuildQuoteLines = z.object({
  cart_id: z.string().min(1).optional(),
  builder_type: builderType,
  options: z.record(optionValue).default({}),
  units: z.number().int().min(1).max(500).optional(),
  source_page: z.string().max(500).optional(),
})
export type StoreBuildQuoteLinesType = z.infer<typeof StoreBuildQuoteLines>
