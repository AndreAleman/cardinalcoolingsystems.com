"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { useCartPanel } from "@lib/context/cart-panel-context"
import { deleteLineItem, updateLineItem } from "@lib/data/cart"
import { notifyCartUpdated } from "@lib/hooks/use-cart-count"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import Link from "next/link"

type CartData = {
  id: string
  currency_code: string
  subtotal?: number
  item_total?: number
  items?: HttpTypes.StoreCartLineItem[]
}

export default function CartPanel() {
  const { isCartPanelOpen, closeCartPanel } = useCartPanel()
  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const fetchedOnce = useRef(false)

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cart/items")
      const data = await res.json()
      setCart(data.cart)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch when panel opens
  useEffect(() => {
    if (isCartPanelOpen) {
      fetchCart()
    }
  }, [isCartPanelOpen, fetchCart])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCartPanel()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [closeCartPanel])

  // Lock body scroll
  useEffect(() => {
    if (isCartPanelOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isCartPanelOpen])

  const handleQuantityChange = async (lineId: string, quantity: number) => {
    if (quantity < 1) return
    setUpdatingId(lineId)
    try {
      await updateLineItem({ lineId, quantity })
      await fetchCart()
      notifyCartUpdated()
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemove = async (lineId: string) => {
    setUpdatingId(lineId)
    try {
      await deleteLineItem(lineId)
      await fetchCart()
      notifyCartUpdated()
    } finally {
      setUpdatingId(null)
    }
  }

  const items = cart?.items ?? []
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = cart?.subtotal ?? cart?.item_total ?? 0
  const currencyCode = cart?.currency_code ?? "usd"

  // Derive countryCode from the current path (first segment, e.g. "/us/...")
  // so the cart link points to the right locale rather than a hardcoded "/us".
  const pathname = usePathname()
  const countryCode = pathname?.split("/").filter(Boolean)[0] || "us"
  const cartPageUrl = `/${countryCode}/cart`

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: isCartPanelOpen ? 1 : 0,
          pointerEvents: isCartPanelOpen ? "auto" : "none",
        }}
        onClick={closeCartPanel}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-[61] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{
          width: "min(440px, 100vw)",
          transform: isCartPanelOpen ? "translateX(0)" : "translateX(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Cart panel"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5" style={{ color: "#E3000F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
            <div className="text-base font-semibold" style={{ color: "#111111" }}>Your Cart</div>
            {itemCount > 0 && (
              <span
                className="text-white text-xs font-semibold px-2 py-0.5 leading-none"
                style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              >
                {itemCount} {itemCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            onClick={closeCartPanel}
            aria-label="Close cart"
            className="flex items-center justify-center w-8 h-8 rounded transition-colors hover:bg-gray-100"
            style={{ color: "#6b7280" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-gray-200 border-t-red-600 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-16 text-center">
              <div
                className="w-16 h-16 flex items-center justify-center"
                style={{ backgroundColor: "#f3f4f6", borderRadius: "5px" }}
              >
                <svg className="w-8 h-8" style={{ color: "#d1d5db" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-sm" style={{ color: "#111111" }}>Your cart is empty</p>
                <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>
                  Add products to your cart to get started.
                </p>
              </div>
              <button
                onClick={closeCartPanel}
                className="text-sm font-medium underline underline-offset-2 transition-colors"
                style={{ color: "#E3000F" }}
              >
                Continue browsing
              </button>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {items.map((item) => {
                const thumbnail =
                  item.variant?.product?.thumbnail ??
                  item.variant?.product?.images?.[0]?.url
                const handle = item.variant?.product?.handle
                const isUpdating = updatingId === item.id
                const unitPrice = item.unit_price ?? 0
                const lineTotal = unitPrice * item.quantity

                return (
                  <li
                    key={item.id}
                    className="flex gap-4 px-6 py-5 transition-opacity duration-200"
                    style={{ opacity: isUpdating ? 0.5 : 1 }}
                  >
                    {/* Thumbnail */}
                    <div
                      className="w-16 h-16 flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center"
                      style={{ borderRadius: "5px", border: "1px solid #f3f4f6" }}
                    >
                      {thumbnail ? (
                        <img
                          src={thumbnail}
                          alt={item.product_title ?? ""}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <svg className="w-7 h-7" style={{ color: "#d1d5db" }} fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                        </svg>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        {handle ? (
                          <Link
                            href={`/us/products/${handle}`}
                            onClick={closeCartPanel}
                            className="text-sm font-medium leading-snug hover:underline"
                            style={{ color: "#111111" }}
                          >
                            {item.product_title}
                          </Link>
                        ) : (
                          <p className="text-sm font-medium leading-snug" style={{ color: "#111111" }}>
                            {item.product_title}
                          </p>
                        )}
                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={isUpdating}
                          aria-label={`Remove ${item.product_title}`}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-gray-100 mt-0.5 disabled:cursor-not-allowed"
                          style={{ color: "#9ca3af" }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Variant title */}
                      {item.variant?.title && item.variant.title !== "Default Variant" && (
                        <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>
                          {item.variant.title}
                        </p>
                      )}

                      {/* SKU */}
                      {item.variant?.sku && (
                        <p className="text-xs font-mono mt-0.5" style={{ color: "#E3000F" }}>
                          SKU: {item.variant.sku}
                        </p>
                      )}

                      {/* Price + qty */}
                      <div className="flex items-center justify-between mt-3">
                        {/* Quantity stepper */}
                        <div
                          className="flex items-center border border-gray-200"
                          style={{ borderRadius: "5px" }}
                        >
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            aria-label="Decrease quantity"
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            style={{ color: "#374151" }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                          </button>
                          <span
                            className="w-8 text-center text-sm font-medium select-none"
                            style={{ color: "#111111" }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                            disabled={isUpdating}
                            aria-label="Increase quantity"
                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            style={{ color: "#374151" }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        </div>

                        {/* Line total */}
                        <span className="text-sm font-semibold" style={{ color: "#111111" }}>
                          {convertToLocale({ amount: lineTotal, currency_code: currencyCode })}
                        </span>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {!loading && items.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-100 px-6 py-5 flex flex-col gap-3">
            {/* Subtotal row */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "#6b7280" }}>Subtotal</span>
              <span className="text-base font-semibold" style={{ color: "#111111" }}>
                {convertToLocale({ amount: subtotal, currency_code: currencyCode })}
              </span>
            </div>
            <p className="text-xs" style={{ color: "#9ca3af" }}>
              Shipping and taxes calculated at checkout
            </p>

            {/* Checkout button */}
            <Link
              href={cartPageUrl}
              onClick={closeCartPanel}
              className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-200"
              style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F")}
            >
              View Cart & Checkout
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
