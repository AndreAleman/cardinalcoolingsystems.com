// The slice of the `cad_request` module the admin routes use, typed structurally so these routes
// compile on their own. The real service (modules/cad-request/service.ts) is a MedusaService over
// {CadRequest, CadPackage, CadSetting}, so the generated list/listAndCount/update methods exist on
// it, plus the hand-written getSettings / updateSettings / countCapGenerations / findApprovedBefore.

import { CAD_REJECT_REASONS, CAD_REQUEST_STATUSES } from "../../../modules/cad-request/types"
import type { CadRejectReason, CadRequestStatus } from "../../../modules/cad-request/types"

export { CAD_REQUEST_MODULE } from "../../../modules/cad-request"
export { CAD_REJECT_REASONS, CAD_REQUEST_STATUSES }
export type { CadRejectReason, CadRequestStatus }

export type CadRequestRow = {
  id: string
  display_id: number
  status: CadRequestStatus
  builder_type: string
  configuration: Record<string, unknown> | null
  config_key: string
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
  token_hash?: string | null
  token_expires_at: Date | string | null
  download_count: number
  last_downloaded_at: Date | string | null
  emailed_at: Date | string | null
  queued_at: Date | string | null
  released_at: Date | string | null
  released_by: string | null
  approved_at?: Date | string | null
  approved_by?: string | null
  attempts: number
  error: string | null
  staff_notes: string | null
  created_at: Date | string
  updated_at: Date | string
}

export type CadPackageRow = {
  id: string
  part_number: string
  cache_key: string
  builder_type: string
  tables_hash: string
  generator_version: string
  drawing_version: number
  status: "generating" | "ready" | "failed"
  step_key?: string | null
  pdf_key?: string | null
  step_bytes: number | null
  pdf_bytes: number | null
  counted_against_cap: boolean
  cap_day: string | null
  generated_at: Date | string | null
  error: string | null
}

export type CadSettingRow = {
  id: string
  daily_generation_cap: number
  require_review?: boolean | null
  updated_by: string | null
}

type ListConfig = {
  take?: number
  skip?: number
  order?: Record<string, "ASC" | "DESC">
  select?: string[]
}

export interface CadRequestAdminService {
  listCadRequests(filters: Record<string, unknown>, config?: ListConfig): Promise<CadRequestRow[]>
  listAndCountCadRequests(filters: Record<string, unknown>, config?: ListConfig): Promise<[CadRequestRow[], number]>
  updateCadRequests(data: Record<string, unknown> | Record<string, unknown>[]): Promise<unknown>
  listCadPackages(filters: Record<string, unknown>, config?: ListConfig): Promise<CadPackageRow[]>
  getSettings(): Promise<CadSettingRow>
  updateSettings(input: { daily_generation_cap?: number; require_review?: boolean; updated_by: string | null }): Promise<CadSettingRow>
  countCapGenerations(capDay: string): Promise<number>
  findApprovedBefore(partNumber: string, excludeId: string): Promise<{ id: string; display_id: number; approved_at: Date | string } | null>
}
