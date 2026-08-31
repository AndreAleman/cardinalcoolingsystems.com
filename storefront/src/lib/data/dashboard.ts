"use server"

/*
  Server actions for the buyer-portal Dashboard's custom backend routes.

  Every route here sits behind the backend's dashboardGate (auth bearer +
  approved Company). Header pattern copied from companies.ts: the SDK
  adds the publishable key, we add the JWT via getAuthHeaders().
*/

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"
import type { Company, TeamMemberRole } from "./companies"

export type DashboardCompany = Company & {
  /* ON = "Place Order" submits an invoice order regardless of size. */
  invoice_payment_enabled: boolean
}

export type DashboardBootstrap = {
  company: DashboardCompany
  role: TeamMemberRole
}

/* GET /store/dashboard — the Dashboard's bootstrap call. */
export const getDashboard = cache(async function (): Promise<DashboardBootstrap | null> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return null
  return sdk.client
    .fetch<DashboardBootstrap>("/store/dashboard", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .catch(() => null)
})

export type DashboardOrderItem = {
  id: string
  title: string
  quantity: number
  variant_sku: string | null
  variant_id: string | null
  unit_price: number
}

export type DashboardOrder = {
  id: string
  display_id: number
  status: string
  total: number
  currency_code: string
  created_at: string
  metadata: Record<string, unknown> | null
  items: DashboardOrderItem[]
}

/* GET /store/dashboard/orders — the Company's Orders, newest first. */
export const getDashboardOrders = cache(async function (): Promise<DashboardOrder[]> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return []
  return sdk.client
    .fetch<{ orders: DashboardOrder[] }>("/store/dashboard/orders", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then(({ orders }) => orders ?? [])
    .catch(() => [])
})

export type Favorite = {
  id: string
  variant_id: string
  created_at?: string
}

/* GET /store/dashboard/favorites — the signed-in person's starred parts. */
export const listFavorites = cache(async function (): Promise<Favorite[]> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return []
  return sdk.client
    .fetch<{ favorites: Favorite[] }>("/store/dashboard/favorites", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then(({ favorites }) => favorites ?? [])
    .catch(() => [])
})

export async function addFavorite(variantId: string): Promise<void> {
  await sdk.client
    .fetch("/store/dashboard/favorites", {
      method: "POST",
      headers: getAuthHeaders(),
      body: { variant_id: variantId },
    })
    .catch(medusaError)
  revalidateTag("favorites")
}

export async function removeFavorite(variantId: string): Promise<void> {
  await sdk.client
    .fetch(`/store/dashboard/favorites/${encodeURIComponent(variantId)}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })
    .catch(medusaError)
  revalidateTag("favorites")
}

export type ApprovalSettings = { requires_admin_approval: boolean }

/* GET /store/dashboard/approval-settings — no row yet means OFF. */
export const getApprovalSettings = cache(async function (): Promise<ApprovalSettings> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return { requires_admin_approval: false }
  return sdk.client
    .fetch<{ approval_settings: ApprovalSettings }>(
      "/store/dashboard/approval-settings",
      { method: "GET", headers, cache: "no-store" }
    )
    .then(({ approval_settings }) => approval_settings)
    .catch(() => ({ requires_admin_approval: false }))
})

/* POST /store/dashboard/approval-settings — admin-only (backend enforces). */
export async function setApprovalSettings(
  requiresAdminApproval: boolean
): Promise<ApprovalSettings> {
  const result = await sdk.client
    .fetch<{ approval_settings: ApprovalSettings }>(
      "/store/dashboard/approval-settings",
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: { requires_admin_approval: requiresAdminApproval },
      }
    )
    .catch(medusaError)
  revalidateTag("company")
  return result.approval_settings
}

export type ApprovalCartItem = {
  title: string
  quantity: number
  variant_sku: string | null
}

export type ApprovalCart = {
  id: string
  total: number
  currency_code: string
  po_number: string | null
  request_type: string | null
  items: ApprovalCartItem[]
}

export type ApprovalSubmitter = {
  id: string
  email: string
  name: string | null
}

export type Approval = {
  id: string
  cart_id: string
  type: "admin"
  status: "pending" | "approved" | "rejected"
  created_by: string
  handled_by: string | null
  created_at?: string
  /* Enriched by the backend: what's being approved, and by whom. */
  cart?: ApprovalCart | null
  submitter?: ApprovalSubmitter | null
}

/*
  GET /store/approvals — role-scoped by the backend: admins/managers see
  the whole Company's approvals, members only their own submissions.
*/
export const listApprovals = cache(async function (): Promise<Approval[]> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return []
  return sdk.client
    .fetch<{ approvals: Approval[] }>("/store/approvals", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then(({ approvals }) => approvals ?? [])
    .catch(() => [])
})

/* POST /store/approvals/:id — approve or reject a held submission. */
export async function decideApproval(
  approvalId: string,
  status: "approved" | "rejected"
): Promise<Approval> {
  const result = await sdk.client
    .fetch<{ approval: Approval }>(
      `/store/approvals/${encodeURIComponent(approvalId)}`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: { status },
      }
    )
    .catch(medusaError)
  revalidateTag("approvals")
  revalidateTag("quotes")
  return result.approval
}
