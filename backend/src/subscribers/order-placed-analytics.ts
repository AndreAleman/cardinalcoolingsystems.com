import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { capturePosthogEvent } from "../lib/posthog"

export default async function orderPlacedAnalyticsHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const { data: orders } = await query.graph({
      entity: "order",
      fields: ["id", "email", "total", "currency_code", "items.quantity"],
      filters: { id: data.id },
    })

    const order = orders[0]
    if (!order) {
      console.warn(`[PostHog] Order ${data.id} not found, skipping order_placed capture`)
      return
    }

    const itemCount = (order.items ?? []).reduce(
      (sum, item) => sum + Number(item?.quantity ?? 0),
      0
    )

    await capturePosthogEvent("order_placed", order.email || order.id, {
      total: Number(order.total),
      order_id: order.id,
      item_count: itemCount,
      currency: order.currency_code,
    })
  } catch (e) {
    // Analytics must never break order processing - log and move on
    console.error(`[PostHog] Failed to capture order_placed for ${data.id}`, e)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
