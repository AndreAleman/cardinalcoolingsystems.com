import { z } from "zod"

export const DAILY_GENERATION_CAP_MAX = 1000

// 0 = queue every new Part Number. require_review: CAD Review R1. Either field may be sent alone;
// at least one.
export type AdminUpdateCadSettingsType = z.infer<typeof AdminUpdateCadSettings>
export const AdminUpdateCadSettings = z
  .object({
    daily_generation_cap: z
      .number({ message: "The daily cap must be a whole number." })
      .int("The daily cap must be a whole number.")
      .min(0, "The daily cap cannot be negative.")
      .max(DAILY_GENERATION_CAP_MAX, `The daily cap can be at most ${DAILY_GENERATION_CAP_MAX}.`)
      .optional(),
    require_review: z.boolean({ message: "require_review must be true or false." }).optional(),
  })
  .strict()
  .refine((v) => v.daily_generation_cap !== undefined || v.require_review !== undefined, {
    message: "Send daily_generation_cap or require_review.",
  })
