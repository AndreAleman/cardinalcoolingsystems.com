import { z } from "zod";

export const AdminGetApprovals = z
  .object({
    status: z.enum(["pending", "approved", "rejected"]).optional(),
  })
  .strict();

export type AdminGetApprovalsType = z.infer<typeof AdminGetApprovals>;

export const AdminUpdateApproval = z.object({
  status: z.enum(["approved", "rejected"]),
});

export type AdminUpdateApprovalType = z.infer<typeof AdminUpdateApproval>;
