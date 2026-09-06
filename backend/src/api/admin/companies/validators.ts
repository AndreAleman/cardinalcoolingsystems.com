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
    // Home site: a Location id assigns, null unassigns.
    location_id: z.string().min(1).nullable().optional(),
  })
  .strict();
export type AdminUpdateTeamMemberType = z.infer<typeof AdminUpdateTeamMember>;

/* A Location: name + shipping address + phone (CARDINAL-managed). */
export const AdminCreateLocation = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    address_1: z.string().min(1, "Address is required").max(200),
    address_2: z.string().max(200).nullable().optional(),
    city: z.string().min(1, "City is required").max(100),
    state: z.string().min(1, "State is required").max(100),
    zip: z.string().min(1, "ZIP is required").max(20),
    phone: z.string().max(50).nullable().optional(),
  })
  .strict();
export type AdminCreateLocationType = z.infer<typeof AdminCreateLocation>;

export const AdminUpdateLocation = AdminCreateLocation.partial();
export type AdminUpdateLocationType = z.infer<typeof AdminUpdateLocation>;

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
