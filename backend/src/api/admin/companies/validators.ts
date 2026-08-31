import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { z } from "zod";
import { COMPANY_STATUSES } from "../../../modules/company/types/status";
import { TEAM_MEMBER_ROLES } from "../../../modules/company/types/role";

export const AdminGetCompaniesParams = createFindParams({ limit: 50, offset: 0 }).merge(
  z.object({
    status: z.enum(COMPANY_STATUSES).optional(),
  })
);
export type AdminGetCompaniesParamsType = z.infer<typeof AdminGetCompaniesParams>;

export const AdminUpdateTeamMember = z
  .object({
    role: z.enum(TEAM_MEMBER_ROLES).optional(),
    spending_limit: z.number().min(0).optional(),
  })
  .strict();
export type AdminUpdateTeamMemberType = z.infer<typeof AdminUpdateTeamMember>;

export const AdminSetInvoicePayment = z
  .object({
    enabled: z.boolean(),
  })
  .strict();
export type AdminSetInvoicePaymentType = z.infer<typeof AdminSetInvoicePayment>;

export const AdminAssignCompanyPriceList = z
  .object({
    price_list_id: z.string().min(1).nullable(),
  })
  .strict();
export type AdminAssignCompanyPriceListType = z.infer<typeof AdminAssignCompanyPriceList>;
