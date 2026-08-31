"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { captureEvent } from "@lib/util/posthog"

/**
 * Fires the `order_completed` purchase event once, from the (server-rendered)
 * order confirmation page. Deduped per order id via sessionStorage so a page
 * refresh doesn't double-count revenue.
 */
export default function OrderCompletedTracker({
  order,
}: {
  order: HttpTypes.StoreOrder
}) {
  useEffect(() => {
    const key = `ph_order_completed_${order.id}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      // sessionStorage unavailable — fall through and still capture once per mount
    }

    captureEvent("order_completed", {
      order_id: order.id,
      // Medusa v2 stores monetary totals as decimals (major units), not cents.
      value: order.total,
      revenue: order.total,
      currency: order.currency_code,
      num_items: order.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0,
      email: order.email,
    })
  }, [order])

  return null
}
