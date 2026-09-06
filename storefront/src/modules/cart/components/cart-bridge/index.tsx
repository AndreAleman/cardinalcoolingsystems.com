"use client"

/*
  Cart-bridge popup — shown when the header cart icon is clicked while
  items sit in BOTH places: the public Medusa cart AND the buyer
  portal's Quick Order draft ("company order").

  Primary action moves every Medusa cart line (variant_id + quantity)
  into the portal draft through the same hydration path Order Again
  uses — live price/stock, so money rules and Quote-Only detection
  apply — then empties the Medusa cart and lands on the Dashboard.
  Secondary keeps the two apart and proceeds to the cart page (which
  shows a banner pointing at the company order).

  Portal conventions: plain overlay modal, large controls, persistent
  states instead of toasts.
*/

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@medusajs/ui"
import { deleteLineItem } from "@lib/data/cart"
import { getPortalProductsByVariantIds } from "@lib/data/order-form"
import { notifyCartUpdated } from "@lib/hooks/use-cart-count"
import {
  loadAnyStoredCart,
  saveStoredCartLines,
} from "@modules/account/components/quick-order/cart-storage"
import {
  buildVariantRowMap,
  rowToCartLine,
} from "@modules/account/components/quick-order/variant-info"

type Props = {
  open: boolean
  onClose: () => void
  medusaCount: number
  portalCount: number
  countryCode: string
}

export default function CartBridgeModal({
  open,
  onClose,
  medusaCount,
  portalCount,
  countryCode,
}: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /* Lines that could not be moved stay in the Medusa cart — persistent
     notice, and the buyer chooses where to go next. */
  const [leftover, setLeftover] = useState<number | null>(null)

  if (!open) return null

  const handleCombine = async () => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/cart/items")
      const data = await res.json()
      const items: Array<{
        id: string
        variant_id?: string | null
        quantity: number
      }> = data?.cart?.items ?? []

      if (!items.length) {
        // Cart emptied elsewhere in the meantime — just go to the order.
        notifyCartUpdated()
        onClose()
        router.push(`/${countryCode}/account`)
        return
      }

      const stored = loadAnyStoredCart()
      if (!stored) {
        throw new Error(
          "We couldn't find your company order draft. Please open your dashboard and try again."
        )
      }

      // Hydrate through the Order Again path: live price + stock, so
      // quote-only rules apply to the moved lines.
      const variantIds = Array.from(
        new Set(
          items
            .map((i) => i.variant_id)
            .filter((id): id is string => Boolean(id))
        )
      )
      const products = await getPortalProductsByVariantIds(
        variantIds,
        countryCode
      )
      const rowMap = buildVariantRowMap(products)

      const merged = [...stored.lines]
      const movedLineIds: string[] = []
      for (const item of items) {
        const row = item.variant_id ? rowMap[item.variant_id] : undefined
        if (!row) continue
        const line = rowToCartLine(row, item.quantity)
        const existing = merged.find((l) => l.variantId === line.variantId)
        if (existing) {
          existing.qty += line.qty
        } else {
          merged.push(line)
        }
        movedLineIds.push(item.id)
      }

      if (!movedLineIds.length) {
        throw new Error(
          "These items couldn't be added to your company order. They're still in your cart."
        )
      }

      saveStoredCartLines(stored.companyId, merged)

      // Empty the Medusa cart of everything that moved.
      for (const lineId of movedLineIds) {
        await deleteLineItem(lineId)
      }
      notifyCartUpdated()

      const unmoved = items.length - movedLineIds.length
      if (unmoved > 0) {
        setLeftover(unmoved)
        return
      }

      onClose()
      router.push(`/${countryCode}/account`)
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  const handleKeepSeparate = () => {
    onClose()
    router.push(`/${countryCode}/cart`)
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="You have items in two places"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={busy ? undefined : onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md rounded-lg bg-white shadow-2xl p-6 flex flex-col gap-4">
        {leftover !== null ? (
          <>
            <h2 className="text-xl font-semibold text-neutral-900 m-0">
              Almost done
            </h2>
            <p className="text-[16px] text-neutral-700 m-0">
              Most items moved into your company order, but {leftover}{" "}
              {leftover === 1 ? "item" : "items"} couldn&apos;t be added and{" "}
              {leftover === 1 ? "is" : "are"} still in your cart.
            </p>
            <Button
              variant="primary"
              size="large"
              className="w-full h-12 text-[18px]"
              onClick={() => {
                onClose()
                router.push(`/${countryCode}/account`)
              }}
            >
              Go to my company order →
            </Button>
            <Button
              variant="secondary"
              size="large"
              className="w-full h-12 text-[18px]"
              onClick={handleKeepSeparate}
            >
              View my cart
            </Button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-neutral-900 m-0">
              You have items in two places
            </h2>
            <div className="rounded border border-neutral-200 bg-neutral-50 px-4 py-3 text-[16px] text-neutral-800 flex flex-col gap-1">
              <span>
                {medusaCount} {medusaCount === 1 ? "item" : "items"} in your
                cart
              </span>
              <span>
                {portalCount} {portalCount === 1 ? "item" : "items"} in your
                company order
              </span>
            </div>

            {error && (
              <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              size="large"
              disabled={busy}
              onClick={handleCombine}
              className="w-full h-12 text-[18px]"
            >
              {busy ? "Combining…" : "Combine into my company order"}
            </Button>
            <Button
              variant="secondary"
              size="large"
              disabled={busy}
              onClick={handleKeepSeparate}
              className="w-full h-12 text-[18px]"
            >
              Keep separate
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
