import type { CadRequest, CadRequestStatus } from "../../hooks/cad-requests"

export const CAD_STATUS_LABEL: Record<CadRequestStatus, string> = {
  pending: "Preparing",
  queued: "Queued",
  review: "Awaiting review",
  emailed: "Emailed",
  ready: "Downloaded (customer)",
  failed: "Failed",
  rejected: "Rejected",
  blocked: "Blocked",
}

export const CAD_STATUS_COLOR: Record<CadRequestStatus, "blue" | "orange" | "green" | "purple" | "grey" | "red"> = {
  pending: "blue",
  queued: "orange",
  review: "orange",
  emailed: "green",
  ready: "green",
  failed: "red",
  rejected: "grey",
  blocked: "purple",
}

export const BLOCK_REASON_LABEL: Record<NonNullable<CadRequest["block_reason"]>, string> = {
  email_allowance: "Email allowance reached (10 in 30 days)",
  ip_daily: "IP limit reached (5 per day)",
}

/* Tabs → list query params (`status` is comma-separated). "All" leaves spam out. */
export const CAD_TABS = [
  { value: "all", label: "All", query: { exclude_spam: "true" } },
  { value: "review", label: "Awaiting review", query: { status: "review" } },
  { value: "queued", label: "Queued", query: { status: "queued" } },
  { value: "delivered", label: "Delivered", query: { status: "emailed,ready" } },
  { value: "blocked", label: "Blocked", query: { status: "blocked" } },
  { value: "failed", label: "Failed", query: { status: "failed" } },
  { value: "spam", label: "Spam", query: { reject_reason: "spam" } },
] as const
export type CadTab = (typeof CAD_TABS)[number]["value"]

export const isCadSpam = (r: Pick<CadRequest, "status" | "reject_reason">) =>
  r.status === "rejected" && r.reject_reason === "spam"

export const cadStatusBadge = (r: Pick<CadRequest, "status" | "reject_reason">) =>
  isCadSpam(r)
    ? { label: "Spam", color: "red" as const }
    : { label: CAD_STATUS_LABEL[r.status], color: CAD_STATUS_COLOR[r.status] }

export const canMarkCadSpam = (r: Pick<CadRequest, "status" | "reject_reason" | "is_customer">) =>
  !r.is_customer && r.status !== "ready" && !isCadSpam(r)

export const cadRef = (displayId: number) => `CAD-${displayId}`

export function requesterLabel(r: Pick<CadRequest, "is_customer" | "customer" | "contact_name" | "email">): string {
  if (r.is_customer) {
    const c = r.customer
    const name = [c?.first_name, c?.last_name].filter(Boolean).join(" ").trim()
    return `Customer: ${name || c?.email || r.email || "unknown"}`
  }
  return r.contact_name || r.email || "—"
}

export function formatBytes(n: number | null | undefined): string {
  if (n == null) return "—"
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleString() : "—")

/* Storefront link for a builder Share Link (share_path has no country prefix). */
export const storefrontShareUrl = (sharePath: string) => `https://cardinalcoolingsystems.com/us${sharePath}`
