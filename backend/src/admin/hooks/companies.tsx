import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { sdk } from "../lib/sdk"

export type { CompanyStatus } from "../../modules/company/types/status"
import type { CompanyStatus } from "../../modules/company/types/status"
import type { TeamMemberRole } from "../../modules/company/types/role"
export type { TeamMemberRole }

export type AdminLocation = {
  id: string
  name: string
  address_1: string
  address_2?: string | null
  city: string
  state: string
  zip: string
  phone?: string | null
}

export type AdminTeamMember = {
  id: string
  role: TeamMemberRole
  spending_limit: number
  location?: { id: string; name: string } | null
  customer?: {
    id: string
    email: string
    first_name?: string | null
    last_name?: string | null
  } | null
}

export type AdminCompany = {
  id: string
  name: string
  email: string
  phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
  country?: string | null
  currency_code?: string | null
  status: CompanyStatus
  welcome_code?: string | null
  price_list_id?: string | null
  invoice_payment_enabled?: boolean
  created_at: string
  employees?: AdminTeamMember[]
  locations?: AdminLocation[]
}

const companiesKey = (status?: CompanyStatus) => ["companies", { status }] as const
const companyKey = (id: string) => ["company", id] as const

export const useCompanies = (status?: CompanyStatus) =>
  useQuery({
    queryKey: companiesKey(status),
    queryFn: () =>
      sdk.client.fetch<{ companies: AdminCompany[]; count: number }>("/admin/companies", {
        query: { limit: 100, ...(status ? { status } : {}) },
      }),
  })

export const useCompany = (id: string) =>
  useQuery({
    queryKey: companyKey(id),
    queryFn: () => sdk.client.fetch<{ company: AdminCompany }>(`/admin/companies/${id}`),
  })

export type AdminPriceList = {
  id: string
  title?: string
  status?: "active" | "draft"
  type?: "sale" | "override"
}

export const useCompanyPriceLists = () =>
  useQuery({
    queryKey: ["company-price-lists"],
    queryFn: () => sdk.admin.priceList.list({ limit: 100, status: ["active"] }),
    select: ({ price_lists }) =>
      (price_lists as AdminPriceList[]).filter((priceList) => priceList.type === "override"),
  })

/* Approve or decline a Company. Invalidates every list and the detail. */
export const useDecideCompany = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (decision: "approve" | "decline") =>
      sdk.client.fetch<{ company: AdminCompany }>(`/admin/companies/${id}/${decision}`, {
        method: "POST",
      }),
    onSuccess: ({ company }) => {
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      queryClient.invalidateQueries({ queryKey: companyKey(id) })
      toast.success(
        company.status === "approved"
          ? `${company.name} approved — their dashboard is unlocked`
          : `${company.name} declined`
      )
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

/* A Custom Price List may belong to exactly one Company. */
export const useAssignCompanyPriceList = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (price_list_id: string | null) =>
      sdk.client.fetch<{ company: AdminCompany }>(`/admin/companies/${id}/price-list`, {
        method: "POST",
        body: { price_list_id },
      }),
    onSuccess: ({ company }) => {
      queryClient.invalidateQueries({ queryKey: companyKey(id) })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      toast.success(company.price_list_id ? "Custom Price List assigned" : "Company will use catalog prices")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

/* Turn invoice payment on or off for a Company. ON: every order any
   size is placed unpaid and billed offline. */
export const useSetInvoicePayment = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (enabled: boolean) =>
      sdk.client.fetch<{ company: AdminCompany }>(`/admin/companies/${id}/invoice-payment`, {
        method: "POST",
        body: { enabled },
      }),
    onSuccess: ({ company }) => {
      queryClient.invalidateQueries({ queryKey: companyKey(id) })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      toast.success(
        company.invoice_payment_enabled
          ? `${company.name} can now pay by invoice`
          : `${company.name} pays by the standard payment rules`
      )
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

/* Change a Team Member's Role, Spending Limit, or Location (null unassigns). */
export const useUpdateTeamMember = (companyId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: {
      teamMemberId: string
      role?: TeamMemberRole
      spending_limit?: number
      location_id?: string | null
    }) =>
      sdk.client.fetch<{ team_member: AdminTeamMember }>(
        `/admin/companies/${companyId}/team-members/${input.teamMemberId}`,
        {
          method: "POST",
          body: {
            ...(input.role !== undefined ? { role: input.role } : {}),
            ...(input.spending_limit !== undefined ? { spending_limit: input.spending_limit } : {}),
            ...(input.location_id !== undefined ? { location_id: input.location_id } : {}),
          },
        }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKey(companyId) })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      toast.success("Team member updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export type LocationInput = {
  name: string
  address_1: string
  address_2?: string | null
  city: string
  state: string
  zip: string
  phone?: string | null
}

/* Locations are Cardinal-managed: created, edited, and deleted here only. */
export const useCreateLocation = (companyId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: LocationInput) =>
      sdk.client.fetch<{ location: AdminLocation }>(`/admin/companies/${companyId}/locations`, {
        method: "POST",
        body: input,
      }),
    onSuccess: ({ location }) => {
      queryClient.invalidateQueries({ queryKey: companyKey(companyId) })
      toast.success(`Location "${location.name}" added`)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useUpdateLocation = (companyId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { locationId: string } & Partial<LocationInput>) => {
      const { locationId, ...body } = input
      return sdk.client.fetch<{ location: AdminLocation }>(
        `/admin/companies/${companyId}/locations/${locationId}`,
        { method: "POST", body }
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKey(companyId) })
      toast.success("Location updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useDeleteLocation = (companyId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (locationId: string) =>
      sdk.client.fetch(`/admin/companies/${companyId}/locations/${locationId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKey(companyId) })
      toast.success("Location removed — team assignments were cleared")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useRemoveTeamMember = (companyId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (teamMemberId: string) =>
      sdk.client.fetch(`/admin/companies/${companyId}/team-members/${teamMemberId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKey(companyId) })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      toast.success("Team member removed")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
