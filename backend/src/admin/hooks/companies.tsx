import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { sdk } from "../lib/sdk"

export type { CompanyStatus } from "../../modules/company/types/status"
import type { CompanyStatus } from "../../modules/company/types/status"
import type { TeamMemberRole } from "../../modules/company/types/role"
export type { TeamMemberRole }

export type AdminTeamMember = {
  id: string
  role: TeamMemberRole
  spending_limit: number
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

/* Change a Team Member's Role or Spending Limit. */
export const useUpdateTeamMember = (companyId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { teamMemberId: string; role?: TeamMemberRole; spending_limit?: number }) =>
      sdk.client.fetch<{ team_member: AdminTeamMember }>(
        `/admin/companies/${companyId}/team-members/${input.teamMemberId}`,
        { method: "POST", body: { role: input.role, spending_limit: input.spending_limit } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyKey(companyId) })
      queryClient.invalidateQueries({ queryKey: ["companies"] })
      toast.success("Team member updated")
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
