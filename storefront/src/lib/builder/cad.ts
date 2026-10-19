// Pure CAD helpers (ported from Sanitube modules/cad/lib/cad-helpers.ts for the Cardinal Builder):
// messages, the visitor gate check, POST /store/cad-requests response mapping, file links and the
// download page's helpers. No React, no Next APIs: safe in server actions, route handlers and
// client components. Unit-tested in __tests__/cad.test.ts.

import { getBuilder, isBuilderType, type BuilderType, type Options } from "@lib/cpq/shared"
import { BUSINESS_EMAIL_MESSAGE, isBusinessEmail } from "@lib/util/business-email"
import type { CadFile, CadFileKind, CadRequestErrorCode, CadRequestResult } from "./types"

export const CAD_MESSAGES = {
  email_allowance:
    "This email has reached its limit of CAD downloads for now. We've let our engineering team know, and they'll be in touch.",
  ip_daily: "Too many CAD requests from this network today. Please try again tomorrow, or request a quote.",
  outside_standard_range:
    "This configuration needs engineering review, so CAD files aren't available yet. Add it to your Quote List instead.",
  unavailable: "CAD downloads are temporarily unavailable.",
  turnstile: "We couldn't verify your browser. Please reload the page and try again.",
  generic: "Something went wrong requesting CAD files. Please try again.",
} as const

/** CAD Review (B7): what the requester sees while engineering reviews the drawing. */
export function cadReviewMessage(email: string | null | undefined): string {
  const to = email && email.trim() ? email.trim() : "your email"
  return `Thanks — our engineering team reviews every CAD drawing before release. We'll email your download link to ${to}, normally within 1 business day.`
}

/** B8: STEP + PDF for the transition and the manifold; PDF only for the kit, strainer and hose. */
export function cadKindsFor(type: BuilderType): CadFileKind[] {
  return getBuilder(type as string).hasStep ? ["step", "pdf"] : ["pdf"]
}

/** "STEP + PDF" or "PDF". */
export function cadKindsLabel(type: BuilderType): string {
  return cadKindsFor(type)
    .map((k) => k.toUpperCase())
    .join(" + ")
}

const CAD_FILE_KINDS: readonly CadFileKind[] = ["step", "pdf"]

export function isCadFileKind(v: unknown): v is CadFileKind {
  return typeof v === "string" && (CAD_FILE_KINDS as readonly string[]).includes(v)
}

/** Download tokens are random base64url strings; allow some slack, nothing else. */
export function isPlausibleCadToken(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(v)
}

/** Same-origin proxy path for a file. Never a backend or bucket URL. */
export function cadFileUrl(token: string, kind: CadFileKind): string {
  return `/api/cad/${encodeURIComponent(token)}/${kind}`
}

export function cadReference(displayId: number | null | undefined): string | null {
  return typeof displayId === "number" && Number.isFinite(displayId) && displayId > 0 ? `CAD-${displayId}` : null
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (typeof bytes !== "number" || !Number.isFinite(bytes) || bytes < 0) return ""
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function cadFileLabel(kind: CadFileKind): string {
  return kind === "step" ? "3D model (STEP)" : "Drawing (PDF)"
}

/** STEP first, then PDF; unknown kinds dropped. */
export function sortCadFiles(files: CadFile[] | null | undefined): CadFile[] {
  return (files ?? [])
    .filter((f) => f && isCadFileKind(f.kind))
    .slice()
    .sort((a, b) => CAD_FILE_KINDS.indexOf(a.kind) - CAD_FILE_KINDS.indexOf(b.kind))
}

/** Builder type + canonical options from a Share Link path ("/build/transition?v=1&…"), or null. */
export function configFromSharePath(sharePath: string | null | undefined): { type: BuilderType; options: Options } | null {
  if (!sharePath) return null
  const [path, query = ""] = sharePath.split("?")
  const m = /\/build\/([a-z-]+)\/?$/.exec(path)
  if (!m || !isBuilderType(m[1])) return null
  const type = m[1] as BuilderType
  return { type, options: getBuilder(type).decode(new URLSearchParams(query)).options }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type CadContact = { name: string; company: string; email: string }

/** Visitor gate: name, company and a work email (no free-mail). */
export function validateCadContact(
  c: Partial<CadContact> | null | undefined,
): { ok: true; value: CadContact } | { ok: false; message: string } {
  const name = (c?.name ?? "").trim()
  const company = (c?.company ?? "").trim()
  const email = (c?.email ?? "").trim().toLowerCase()
  if (!name) return { ok: false, message: "Your name is required." }
  if (name.length > 120) return { ok: false, message: "Your name is too long." }
  if (!company) return { ok: false, message: "Company name is required." }
  if (company.length > 200) return { ok: false, message: "Company name is too long." }
  if (!email) return { ok: false, message: "Work email is required." }
  if (!EMAIL_RE.test(email) || email.length > 254) return { ok: false, message: "That doesn't look like a valid email." }
  if (!isBusinessEmail(email)) return { ok: false, message: BUSINESS_EMAIL_MESSAGE }
  return { ok: true, value: { name, company, email } }
}

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined)
const fail = (code: CadRequestErrorCode, message: string): CadRequestResult => ({ ok: false, code, message })

/**
 * Maps a POST /store/cad-requests response (status + parsed body) to the panel's result. Outcomes
 * per the plan: review | queued | blocked (plus Sanitube's ready / emailed, handled if sent).
 * `email` is the address the visitor typed, used when the body doesn't echo one.
 */
export function mapCadRequestResponse(status: number, body: unknown, email?: string | null): CadRequestResult {
  const b = (body && typeof body === "object" ? body : null) as Record<string, unknown> | null

  if (status >= 200 && status < 300 && b) {
    const partNumber = str(b.part_number) ?? ""
    const outcome = b.outcome
    if (outcome === "blocked") return { ok: true, outcome: "blocked" }
    if (outcome === "ready") {
      const download = b.download as { token?: unknown; files?: unknown } | undefined
      const token = download && str(download.token)
      if (!token) return fail("invalid", CAD_MESSAGES.generic)
      const files = sortCadFiles(Array.isArray(download!.files) ? (download!.files as CadFile[]) : [])
      return { ok: true, outcome: "ready", partNumber, token, files }
    }
    if (outcome === "review" || outcome === "queued" || outcome === "emailed") {
      const req = b.cad_request as { display_id?: unknown } | undefined
      const displayId = typeof req?.display_id === "number" ? req.display_id : null
      return { ok: true, outcome, partNumber, displayId, email: str(b.email) ?? (email || null) }
    }
    return fail("invalid", CAD_MESSAGES.generic)
  }

  const code = str(b?.code)
  const type = str(b?.type)
  const message = str(b?.message)

  if (status === 503 || type === "cad_unavailable") return fail("unavailable", CAD_MESSAGES.unavailable)
  if ((status === 400 || status === 403) && /turnstile/i.test(`${code ?? ""} ${type ?? ""}`)) {
    return fail("turnstile", CAD_MESSAGES.turnstile)
  }
  if (status === 429) {
    if (code === "email_allowance") return fail("email_allowance", message ?? CAD_MESSAGES.email_allowance)
    return fail("ip_daily", message ?? CAD_MESSAGES.ip_daily)
  }
  if (code === "outside_standard_range" || type === "outside_standard_range") {
    return fail("outside_standard_range", CAD_MESSAGES.outside_standard_range)
  }
  if (status >= 400 && status < 500 && message) return fail("invalid", message)
  return fail("invalid", CAD_MESSAGES.generic)
}

/** Plain-text body the download proxy returns when the backend refuses a file. */
export function cadProxyErrorMessage(status: number): string {
  switch (status) {
    case 404:
      return "This download link isn't valid."
    case 409:
      return "These CAD files are still being prepared. Please try again in a minute."
    case 410:
      return "This download link has expired. Request the files again from the builder."
    case 429:
      return "This link has reached its download limit. Request the files again from the builder."
    case 503:
      return CAD_MESSAGES.unavailable
    default:
      return "The download failed. Please try again."
  }
}

/** "Oct 23, 2026" (America/New_York, B7), or "" when unparseable. */
export function formatCadExpiry(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { timeZone: "America/New_York", year: "numeric", month: "short", day: "numeric" })
}

export const CAD_PREPARING_REFRESH_MS = 5_000
export const CAD_PREPARING_MAX_REFRESHES = 24
