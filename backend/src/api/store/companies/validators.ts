import { z } from "zod";

export const StoreSignupCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
});
export type StoreSignupCompanyType = z.infer<typeof StoreSignupCompanySchema>;
