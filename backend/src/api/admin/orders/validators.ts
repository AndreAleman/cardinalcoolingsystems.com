import { z } from "zod";

export const AdminSetOrderDepositStatus = z
  .object({
    status: z.enum(["deposit_invoiced", "balance_invoiced", "paid"]),
  })
  .strict();
export type AdminSetOrderDepositStatusType = z.infer<
  typeof AdminSetOrderDepositStatus
>;
