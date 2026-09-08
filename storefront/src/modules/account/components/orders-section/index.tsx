"use client"

/*
  Orders section — the Company's recent Orders plus "Order Again": parts
  from past Orders offered for one-click reuse (CONTEXT.md). Adding a
  part drops it into the same Quick Order draft at the top of the page,
  with live price/stock (server-prefetched variant info) deciding
  whether it's Buyable or Quote-Only.
*/

import { useMemo } from "react"
import { toast } from "@medusajs/ui"
import {
  amberPillClass,
  btnSecondary,
  captionClass,
  emptyStateClass,
  headingClass,
  skuClass,
} from "../portal-ui"
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
        <h2 className={`${headingClass} mb-4`}>Order Again</h2>
        {orderAgainRows.length === 0 ? (
          <p className={`${emptyStateClass} m-0`}>
            Parts from your past orders will show up here for one-click
            reordering.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 border-y border-gray-200">
            {orderAgainRows.map((row) => {
              const info = variantInfo[row.variantId]
              return (
                <li
                  key={row.variantId}
                  className="flex items-center justify-between gap-3 py-2 transition-colors motion-reduce:transition-none hover:bg-gray-50"
                >
                  <div className="min-w-0">
                    <span className={skuClass}>{row.sku ?? "—"}</span>
                    <span className={`${captionClass} ml-2 truncate`}>
                      {row.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 whitespace-nowrap">
                    {info?.unitPrice && info.unitPrice > 0 ? (
                      <span className="text-[16px] tabular-nums text-[#111111]">
                        {convertToLocale({
                          amount: info.unitPrice,
                          currency_code: info.currencyCode ?? "usd",
                        })}
                      </span>
                    ) : (
                      <span className={amberPillClass}>Quote only</span>
                    )}
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() => addToOrder(row.variantId, row.title)}
                    >
                      Add to order
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div>
        <h2 className={`${headingClass} mb-4`}>Recent Orders</h2>
        {orders.length === 0 ? (
          <p className={`${emptyStateClass} m-0`}>
            No orders yet — your first order will show up here.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-gray-100 border-y border-gray-200">
            {orders.slice(0, MAX_ORDERS_SHOWN).map((order) => (
              <li
                key={order.id}
                className="flex flex-col small:flex-row small:items-center justify-between gap-2 py-3 transition-colors motion-reduce:transition-none hover:bg-gray-50"
              >
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="text-[16px] font-semibold text-[#111111]">
                    Order #{order.display_id}
                  </span>
                  <span className="text-[14px] text-[#6b7280]">
                    {formatDate(order.created_at)}
                  </span>
                  <span className="text-[13px] uppercase tracking-wider text-[#6b7280]">
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[16px] tabular-nums text-[#111111]">
                    {convertToLocale({
                      amount: order.total,
                      currency_code: order.currency_code ?? "usd",
                    })}
                    <span className="text-[#6b7280]">
                      {" "}
                      · {order.items?.length ?? 0}{" "}
                      {(order.items?.length ?? 0) === 1 ? "item" : "items"}
                    </span>
                  </span>
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                    className={btnSecondary}
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
