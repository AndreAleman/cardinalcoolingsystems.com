import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "@medusajs/ui"
import { sdk } from "../lib/sdk"

import type { QuoteStatus } from "../../modules/quote/types"
export type { QuoteStatus }

/* ── shapes (subset of what /admin/quotes returns via query.graph) ──── */

export type AdminQuoteAddress = {
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  address_1?: string | null
  address_2?: string | null
  city?: string | null
  province?: string | null
  postal_code?: string | null
  country_code?: string | null
  phone?: string | null
  metadata?: Record<string, unknown> | null
}

export type AdminQuoteItem = {
  id: string
  title: string
  quantity: number
  unit_price: number
  total?: number
  variant?: {
    id: string
    sku?: string | null
    title?: string | null
    product?: { id: string; title?: string | null } | null
  } | null
}

export type AdminQuoteMessage = {
  id: string
  text: string
  item_id?: string | null
  admin_id?: string | null
  customer_id?: string | null
  created_at?: string
}

export type AdminQuote = {
  id: string
  status: QuoteStatus
  customer_id: string
  draft_order_id: string
  created_at: string
  updated_at: string
  customer?: {
    id: string
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    phone?: string | null
    employee?: { company?: { id: string; name?: string | null } | null } | null
  } | null
  messages?: AdminQuoteMessage[]
  cart?: {
    id: string
    metadata?: Record<string, unknown> | null
    billing_address?: AdminQuoteAddress | null
    shipping_address?: AdminQuoteAddress | null
  } | null
  draft_order?: {
    id: string
    display_id?: number
    currency_code: string
    status?: string
    total?: number
    subtotal?: number
    tax_total?: number
    shipping_total?: number
    item_total?: number
    items?: AdminQuoteItem[]
  } | null
}

export type AdminQuoteResponse = { quote: AdminQuote }
export type AdminQuotesResponse = {
  quotes: AdminQuote[]
  count: number
  offset: number
  limit: number
}

const quotesKey = ["quotes"] as const
const quoteKey = (id: string) => ["quote", id] as const

/* Company rides along via customer → employee → company (read-only
   links); "+" extends the route's default field set. */
const COMPANY_FIELDS = "+customer.employee.company.id,+customer.employee.company.name"

export const useQuotes = () =>
  useQuery({
    queryKey: quotesKey,
    queryFn: () =>
      sdk.client.fetch<AdminQuotesResponse>("/admin/quotes", {
        query: { limit: 100, order: "-created_at", fields: COMPANY_FIELDS },
      }),
  })

export const useQuote = (id: string) =>
  useQuery({
    queryKey: quoteKey(id),
    queryFn: () =>
      sdk.client.fetch<AdminQuoteResponse>(`/admin/quotes/${id}`, {
        query: { fields: COMPANY_FIELDS },
      }),
    enabled: !!id,
  })

/* ── lifecycle actions ──────────────────────────────────────────────── */

export const useSendQuote = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<AdminQuoteResponse>(`/admin/quotes/${id}/send`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesKey })
      queryClient.invalidateQueries({ queryKey: quoteKey(id) })
      toast.success("Quote sent to the customer")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useRejectQuote = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<AdminQuoteResponse>(`/admin/quotes/${id}/reject`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesKey })
      queryClient.invalidateQueries({ queryKey: quoteKey(id) })
      toast.success("Quote rejected")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

export const useCreateQuoteMessage = (id: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { text: string; item_id?: string | null }) =>
      sdk.client.fetch<AdminQuoteResponse>(`/admin/quotes/${id}/messages`, {
        method: "POST",
        body: input,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quoteKey(id) })
      toast.success("Message sent to the customer")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

/* ── internal markup calculator (ADMIN ONLY — never on /store) ──────── */

export type QuoteLinePricingLine = {
  item_id: string
  title: string
  quantity: number
  sell_price: number
  cost: number | null
  markup_pct: number | null
  computed_sell: number | null
}

export type QuoteLinePricingResponse = {
  line_pricings: QuoteLinePricingLine[]
  totals: {
    total_cost: number
    total_sell: number
    margin: number
    margin_pct: number | null
    priced_lines: number
    unpriced_lines: number
  }
}

const linePricingKey = (quoteId: string) => ["quote-line-pricing", quoteId] as const

export const useQuoteLinePricing = (quoteId: string) =>
  useQuery({
    queryKey: linePricingKey(quoteId),
    queryFn: () =>
      sdk.client.fetch<QuoteLinePricingResponse>(
        `/admin/quotes/${quoteId}/line-pricing`
      ),
    enabled: !!quoteId,
  })

export const useSetQuoteLinePricing = (quoteId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (prices: { item_id: string; cost: number; markup_pct: number }[]) =>
      sdk.client.fetch<QuoteLinePricingResponse>(
        `/admin/quotes/${quoteId}/line-pricing`,
        { method: "POST", body: { prices } }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: linePricingKey(quoteId) })
      toast.success("Line pricing saved")
    },
    onError: (err: Error) => toast.error(err.message),
  })
}
