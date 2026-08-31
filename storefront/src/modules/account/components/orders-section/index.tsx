"use client"

/*
  Orders section — the Company's recent Orders plus "Order Again": parts
  from past Orders offered for one-click reuse (CONTEXT.md). Adding a
  part drops it into the same Quick Order draft at the top of the page,
  with live price/stock (server-prefetched variant info) deciding
  whether it's Buyable or Quote-Only.
*/

import { useMemo } from "react"
import { Button, toast } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { usePortalCart } from "@lib/context/portal-cart-context"
import type { DashboardOrder } from "@lib/data/dashboard"
import { rowToCartLine, type VariantRow } from "../quick-order/variant-info"

type Props = {
  orders: DashboardOrder[]
  /* Live variant info keyed by variant id (may miss retired parts). */
  variantInfo: Record<string, VariantRow>
}

const MAX_ORDERS_SHOWN = 5
const MAX_ORDER_AGAIN_ROWS = 8

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return value
  }
}

const OrdersSection = ({ orders, variantInfo }: Props) => {
  const { addLine } = usePortalCart()

  /* Unique parts across past orders, newest order first. */
  const orderAgainRows = useMemo(() => {
    const seen = new Set<string>()
    const rows: { variantId: string; title: string; sku: string | null }[] = []
    for (const order of orders) {
      for (const item of order.items ?? []) {
        if (!item.variant_id || seen.has(item.variant_id)) continue
        seen.add(item.variant_id)
        rows.push({
          variantId: item.variant_id,
          title: item.title,
          sku: item.variant_sku,
        })
      }
    }
    return rows.slice(0, MAX_ORDER_AGAIN_ROWS)
  }, [orders])

  const addToOrder = (variantId: string, fallbackTitle: string) => {
    const info = variantInfo[variantId]
    if (!info) {
      toast.error(`${fallbackTitle} is no longer available to order online.`)
      return
    }
    addLine(rowToCartLine(info, 1))
    toast.success(`Added ${info.sku ?? info.title} to your order`)
    // Bring the Quick Order draft into view so the add is visible.
    document
      .querySelector('[data-testid="quick-order"]')
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <section className="flex flex-col gap-6" data-testid="orders-section">
      <div>
        <h2 className="text-xl-semi mb-4">Order Again</h2>
        {orderAgainRows.length === 0 ? (
          <p className="text-[16px] text-neutral-500 m-0">
            Parts from your past orders will show up here for one-click
            reordering.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-100 border-y border-neutral-100">
            {orderAgainRows.map((row) => {
              const info = variantInfo[row.variantId]
              return (
                <li
                  key={row.variantId}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <div className="min-w-0">
                    <span className="font-mono text-[16px]">
                      {row.sku ?? "—"}
                    </span>
                    <span className="text-[15px] text-neutral-500 ml-2 truncate">
                      {row.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    {info?.unitPrice && info.unitPrice > 0 ? (
                      <span className="text-[16px] tabular-nums">
                        {convertToLocale({
                          amount: info.unitPrice,
                          currency_code: info.currencyCode ?? "usd",
                        })}
                      </span>
                    ) : (
                      <span className="text-[14px] text-amber-700 font-semibold">
                        Quote only
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      className="h-12 px-5 text-[16px]"
                      onClick={() => addToOrder(row.variantId, row.title)}
                    >
                      Add to order
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div>
        <h2 className="text-xl-semi mb-4">Recent Orders</h2>
        {orders.length === 0 ? (
          <p className="text-[16px] text-neutral-500 m-0">
            No orders yet — your first order will show up here.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-neutral-100 border-y border-neutral-100">
            {orders.slice(0, MAX_ORDERS_SHOWN).map((order) => (
              <li
                key={order.id}
                className="flex flex-col small:flex-row small:items-center justify-between gap-2 py-3"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[16px] font-semibold">
                    Order #{order.display_id}
                  </span>
                  <span className="text-[15px] text-neutral-500">
                    {formatDate(order.created_at)}
                  </span>
                  <span className="text-[14px] uppercase tracking-wide text-neutral-500">
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[16px] tabular-nums">
                    {convertToLocale({
                      amount: order.total,
                      currency_code: order.currency_code ?? "usd",
                    })}
                    <span className="text-neutral-500">
                      {" "}
                      · {order.items?.length ?? 0}{" "}
                      {(order.items?.length ?? 0) === 1 ? "item" : "items"}
                    </span>
                  </span>
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                    className="inline-flex items-center h-12 px-5 rounded-md border border-neutral-300 text-[16px] font-medium hover:bg-neutral-50"
                  >
                    Details
                  </LocalizedClientLink>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

export default OrdersSection
