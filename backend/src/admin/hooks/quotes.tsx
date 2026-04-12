import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

export type QuoteDraftOrder = {
  id: string
  display_id: number
  status: string
  email: string
  created_at: string
  metadata?: {
    source?: string
    company?: string
    phone?: string
    timeline?: string
    notes?: string
    submitted_at?: string
  }
  items?: Array<{
    id: string
    title: string
    quantity: number
    unit_price: number
    variant?: {
      id: string
      sku?: string
      title?: string
    }
  }>
}

export const useQuoteRequests = () => {
  const { data, ...rest } = useQuery({
    queryKey: ["quote_requests"],
    queryFn: () =>
      sdk.client.fetch<{ draft_orders: QuoteDraftOrder[]; count: number }>(
        "/admin/draft-orders",
        {
          query: {
            limit: 100,
            offset: 0,
            fields: "id,display_id,status,email,created_at,metadata,items.*,items.variant.*",
          },
        }
      ),
    refetchInterval: 30_000,
  })

  return {
    draft_orders: (data?.draft_orders ?? []).filter(
      (o) => o.metadata?.source === "quote_request"
    ),
    count: data?.count ?? 0,
    ...rest,
  }
}
