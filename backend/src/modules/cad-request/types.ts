// CAD Request module DTOs and constants (ported from Sanitube's cad-request module; plan B7).

import type { BuilderType } from "../../lib/cpq-shared"

export const CAD_BUILDER_TYPES = ["cdu-kit", "row-manifold", "transition", "strainer", "hose"] as const

export const CAD_REQUEST_STATUSES = [
  "pending",
  "queued",
  "review",
  "emailed",
  "ready",
  "failed",
  "rejected",
  "blocked",
] as const
export type CadRequestStatus = (typeof CAD_REQUEST_STATUSES)[number]
export type CadIpSource = "forwarded" | "cf" | "xff" | "socket"
export type CadBlockReason = "email_allowance" | "ip_daily"
export const CAD_REJECT_REASONS = ["spam", "other"] as const
export type CadRejectReason = (typeof CAD_REJECT_REASONS)[number]
export type CadPackageStatus = "generating" | "ready" | "failed"

/** CAD Allowance: counted visitor CAD Requests per Business Email per rolling 30 days. */
export const CAD_EMAIL_ALLOWANCE = 10
export const CAD_EMAIL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
/** Counted visitor CAD Requests per trusted IP per rolling 24 h. */
export const CAD_IP_DAILY_LIMIT = 5
export const CAD_IP_WINDOW_MS = 24 * 60 * 60 * 1000
/** Default site-wide cap of never-generated Part Numbers per America/New_York day. */
export const CAD_DEFAULT_DAILY_GENERATION_CAP = 10
export const CAD_MAX_DAILY_GENERATION_CAP = 1000
/** Download link: 7 days, 20 file downloads. */
export const CAD_TOKEN_TTL_HOURS = 168
export const CAD_DOWNLOAD_LIMIT = 20

export type CadRequestDTO = {
  id: string
  display_id: number
  status: CadRequestStatus
  builder_type: BuilderType
  /** The builder's canonical options object. */
  configuration: Record<string, unknown>
  config_key: string
  part_number: string
  description: string
  is_customer: boolean
  customer_id: string | null
  contact_name: string | null
  company_name: string | null
  email: string | null
  client_ip: string | null
  ip_source: CadIpSource | null
  source_page: string | null
  counted: boolean
  block_reason: CadBlockReason | null
  reject_reason: CadRejectReason | null
  package_id: string | null
  token_hash: string | null
  token_expires_at: Date | null
  download_count: number
  last_downloaded_at: Date | null
  emailed_at: Date | null
  queued_at: Date | null
  released_at: Date | null
  released_by: string | null
  approved_at: Date | null
  approved_by: string | null
  attempts: number
  error: string | null
  staff_notes: string | null
  created_at: Date
  updated_at: Date
}

export type CadPackageDTO = {
  id: string
  part_number: string
  cache_key: string
  builder_type: BuilderType
  configuration: Record<string, unknown>
  tables_hash: string
  generator_version: string
  drawing_version: number
  status: CadPackageStatus
  /** null for PDF-only kinds (cdu-kit, strainer, hose; plan B8). */
  step_key: string | null
  pdf_key: string | null
  step_bytes: number | null
  pdf_bytes: number | null
  step_sha256: string | null
  pdf_sha256: string | null
  counted_against_cap: boolean
  cap_day: string | null
  generated_at: Date | null
  error: string | null
  created_at: Date
  updated_at: Date
}

export type CadSettingDTO = {
  id: string
  daily_generation_cap: number
  require_review: boolean
  updated_by: string | null
  created_at: Date
  updated_at: Date
}
