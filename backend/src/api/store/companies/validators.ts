import { z } from "zod";

export const StoreSignupCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  // Cardinal calls every membership request before approving it.
  phone: z.string().trim().min(7, "Phone number is required").max(50),
});
export type StoreSignupCompanyType = z.infer<typeof StoreSignupCompanySchema>;
