import { z } from "zod";

/* Validators for the Dashboard approval routes. */

export const StoreUpdateApproval = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type StoreUpdateApprovalType = z.infer<typeof StoreUpdateApproval>;

export const StoreUpdateApprovalSettings = z.object({
  requires_admin_approval: z.boolean(),
});

export type StoreUpdateApprovalSettingsType = z.infer<
  typeof StoreUpdateApprovalSettings
>;
