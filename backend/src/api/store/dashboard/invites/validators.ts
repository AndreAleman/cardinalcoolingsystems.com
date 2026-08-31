import { z } from "zod";

export const StoreInviteSchema = z.object({
  email: z.string().trim().email(),
});
export type StoreInviteType = z.infer<typeof StoreInviteSchema>;
