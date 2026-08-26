import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { sdk } from "../lib/sdk"

export type { CompanyStatus } from "../../modules/company/types/status"
import type { CompanyStatus } from "../../modules/company/types/status"

export type AdminTeamMember = {
  id: string
  is_admin: boolean
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
