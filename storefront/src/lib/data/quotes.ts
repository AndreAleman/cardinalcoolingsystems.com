"use server"

/*
  Server actions for the Dashboard's Quotes section — the signed-in Team
  Member's own quotes (/store/quotes is customer_id-scoped server-side).
  Adapted from accurateforklift.net's quotes data layer.
*/

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders } from "./cookies"

export type QuoteStatus =
  | "pending_merchant"
  | "pending_customer"
  | "accepted"
  | "customer_rejected"
  | "merchant_rejected"

export type QuoteMessage = {
  id: string
  text: string
  item_id: string | null
  admin_id: string | null
  customer_id: string | null
  created_at: string
}

export type PortalQuote = {
  id: string
  status: QuoteStatus
  customer_id: string
  draft_order_id: string
  cart_id: string
  created_at: string
  updated_at: string
  messages?: QuoteMessage[]
  customer?: HttpTypes.StoreCustomer | null
  cart?: { id: string; metadata?: Record<string, unknown> | null } | null
  draft_order: HttpTypes.StoreOrder & {
    metadata?: Record<string, unknown> | null
  }
  order_preview?: HttpTypes.StoreOrder
}

export async function fetchQuotes(): Promise<PortalQuote[]> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return []
  return sdk.client
    .fetch<{ quotes: PortalQuote[] }>("/store/quotes?order=-created_at", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then(({ quotes }) => quotes ?? [])
    .catch(() => [])
}

export async function fetchQuote(id: string): Promise<PortalQuote | null> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return null
  return sdk.client
    .fetch<{ quote: PortalQuote }>(`/store/quotes/${encodeURIComponent(id)}`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then(({ quote }) => quote)
    .catch(() => null)
}

/* The quote plus the live order-edit preview (staged prices/quantities). */
export async function fetchQuotePreview(id: string): Promise<PortalQuote | null> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return null
  return sdk.client
    .fetch<{ quote: PortalQuote }>(
      `/store/quotes/${encodeURIComponent(id)}/preview`,
      { method: "GET", headers, cache: "no-store" }
    )
    .then(({ quote }) => quote)
    .catch(() => null)
}

/* Accepting places the order — PO number required (backend validator). */
export async function acceptQuote(
  id: string,
  poNumber: string
): Promise<PortalQuote> {
  const result = await sdk.client
    .fetch<{ quote: PortalQuote }>(
      `/store/quotes/${encodeURIComponent(id)}/accept`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: { po_number: poNumber },
      }
    )
    .catch(medusaError)
  revalidateTag("quotes")
  revalidateTag("orders")
  return result.quote
}

export async function rejectQuote(id: string): Promise<PortalQuote> {
  const result = await sdk.client
    .fetch<{ quote: PortalQuote }>(
      `/store/quotes/${encodeURIComponent(id)}/reject`,
      { method: "POST", headers: getAuthHeaders(), body: {} }
    )
    .catch(medusaError)
  revalidateTag("quotes")
  return result.quote
}

export async function createQuoteMessage(
  id: string,
  text: string
): Promise<PortalQuote> {
  const result = await sdk.client
    .fetch<{ quote: PortalQuote }>(
      `/store/quotes/${encodeURIComponent(id)}/messages`,
      { method: "POST", headers: getAuthHeaders(), body: { text } }
    )
    .catch(medusaError)
  revalidateTag("quotes")
  return result.quote
}
