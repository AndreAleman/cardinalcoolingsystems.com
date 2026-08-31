import { z } from "zod";

export const StoreFavoriteSchema = z.object({
  variant_id: z.string().min(1, "variant_id is required"),
});

export type StoreFavoriteType = z.infer<typeof StoreFavoriteSchema>;
