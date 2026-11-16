import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

/* CAD Requests admin hooks (Cardinal Builder plan B7, ported from Sanitube's CAD Review UI). */

export type CadRequestStatus = "pending" | "queued" | "review" | "emailed" | "ready" | "failed" | "rejected" | "blocked"
export type CadRejectReason = "spam" | "other"

export type CadTokenState = {
  issued: boolean
  expires_at: string | null
  expired: boolean
  downloads_used: number
  downloads_remaining: number
  active: boolean
}

export type CadCustomer = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
}

export type CadRequest = {
  id: string
  display_id: number
  status: CadRequestStatus
  builder_type: string
  builder_title: string
  has_step: boolean
  configuration: Record<string, unknown> | null
  configuration_display: { label: string; value: string }[]
  share_path: string | null
  part_number: string
  description: string
  is_customer: boolean
  customer_id: string | null
  contact_name: string | null
  company_name: string | null
  email: string | null
  client_ip: string | null
  ip_source: "forwarded" | "cf" | "xff" | "socket" | null
  source_page: string | null
  counted: boolean
  block_reason: "email_allowance" | "ip_daily" | null
  reject_reason?: CadRejectReason | null
  package_id: string | null
  token: CadTokenState
  last_downloaded_at: string | null
  emailed_at: string | null
  queued_at: string | null
  released_at: string | null
  released_by: string | null
  approved_at?: string | null
  approved_by?: string | null
  attempts: number
  error: string | null
  staff_notes: string | null
  customer?: CadCustomer | null
  created_at: string
}

export type CadPackage = {
  id: string
  part_number: string
  tables_hash: string
  generator_version: string
  drawing_version: number
  status: "generating" | "ready" | "failed"
  has_step: boolean
  has_pdf: boolean
  step_bytes: number | null
  pdf_bytes: number | null
  counted_against_cap: boolean
  cap_day: string | null
  generated_at: string | null
  error: string | null
}

export type CadRequestHistoryItem = Pick<
  CadRequest,
  "id" | "display_id" | "status" | "builder_type" | "part_number" | "description" | "is_customer" | "created_at"
>

export type CadRequestsListResponse = { cad_requests: CadRequest[]; count: number; limit: number; offset: number }

export type CadRequestDetailResponse = {
  cad_request: CadRequest
  package: CadPackage | null
  customer: CadCustomer | null
  matched_customer: { id: string; email: string } | null
  history: { cad_requests: CadRequestHistoryItem[] }
  approved_before: { id: string; display_id: number; approved_at: string } | null
}

export type CadRequestResponse = { cad_request: CadRequest; outcome?: string }

export type CadSettingsResponse = {
  daily_generation_cap: number
  require_review: boolean
  updated_by: string | null
  today: { cap_day: string; generated: number; queued: number; review: number }
  service: { enabled: boolean; healthy: boolean; generator_version: string | null; tables_hash: string | null }
}

export type CadRequestAction = "release" | "reject" | "resend" | "approve" | "spam"

/** CAD Review R10: admin-only file route (session cookie; same origin as the admin). */
export const cadAdminFileUrl = (id: string, kind: "pdf" | "step", download = false) =>
  `/admin/cad-requests/${id}/files/${kind}${download ? "?download=1" : ""}`

const KEY = ["cad_requests"] as const
const SETTINGS_KEY = ["cad_settings"] as const

export const useCadRequests = (query: Record<string, string | number | undefined>) => {
  const qs = new URLSearchParams(
    Object.entries(query)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  ).toString()
  return useQuery({
    queryKey: [...KEY, "list", qs],
    queryFn: () => sdk.client.fetch<CadRequestsListResponse>(`/admin/cad-requests${qs ? `?${qs}` : ""}`),
  })
}

export const useCadRequest = (id: string) =>
  useQuery({
    queryKey: [...KEY, "detail", id],
    queryFn: () => sdk.client.fetch<CadRequestDetailResponse>(`/admin/cad-requests/${id}`),
    enabled: !!id,
  })

export const useUpdateCadRequest = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { staff_notes: string | null }) =>
      sdk.client.fetch<CadRequestResponse>(`/admin/cad-requests/${id}`, { method: "POST", body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

/* Approve & send, Generate now / Release now / Retry (release), Reject, Resend link, Mark spam. */
export const useCadRequestAction = (id: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ action, staff_notes }: { action: CadRequestAction; staff_notes?: string | null }) =>
      sdk.client.fetch<CadRequestResponse>(`/admin/cad-requests/${id}/${action}`, {
        method: "POST",
        body: (action === "reject" || action === "spam") && staff_notes !== undefined ? { staff_notes } : {},
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: SETTINGS_KEY })
    },
  })
}

export const useCadSettings = () =>
  useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: () => sdk.client.fetch<CadSettingsResponse>("/admin/cad-settings"),
  })

export const useUpdateCadSettings = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: { daily_generation_cap?: number; require_review?: boolean }) =>
      sdk.client.fetch<CadSettingsResponse>("/admin/cad-settings", { method: "POST", body }),
    onSuccess: (data) => {
      qc.setQueryData(SETTINGS_KEY, data)
      qc.invalidateQueries({ queryKey: KEY })
    },
  })
}
