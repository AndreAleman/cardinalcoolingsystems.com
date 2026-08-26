import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";
import { COMPANY_STATUSES } from "../../../modules/company/types/status";

export const AdminGetCompaniesParams = createFindParams({ limit: 50, offset: 0 }).merge(
  z.object({
    status: z.enum(COMPANY_STATUSES).optional(),
  })
);
export type AdminGetCompaniesParamsType = z.infer<typeof AdminGetCompaniesParams>;
