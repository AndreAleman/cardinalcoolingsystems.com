"use client"

import { useState, useEffect } from "react"
import {
  countStoredCartUnits,
  PORTAL_CART_UPDATED_EVENT,
} from "@modules/account/components/quick-order/cart-storage"

// Fired by any component that mutates the cart so the header badge refreshes
// without polling. The previous implementation polled /api/cart/count every
// 3 seconds for every visitor — a constant network/battery drain (especially
// on mobile) and steady load on the Medusa backend.
export const CART_UPDATED_EVENT = "cart-updated"

export function notifyCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CART_UPDATED_EVENT))
  }
}

/*
  Both sides of the cart bridge: the Medusa cookie cart (server-counted)
  and the buyer portal's Quick Order draft (localStorage, present only
  for signed-in approved Team Members). Guests always see portalCount 0.
*/
export function useCartCounts(): { medusaCount: number; portalCount: number } {
  const [medusaCount, setMedusaCount] = useState(0)
  const [portalCount, setPortalCount] = useState(0)

  useEffect(() => {
    let active = true

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/cart/count")
        if (!res.ok) return
        const data = await res.json()
        if (active) setMedusaCount(data.count || 0)
      } catch {
        // Transient network failure — keep the last known count
      }
    }

    const readPortalCount = () => {
      if (active) setPortalCount(countStoredCartUnits())
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchCount()
        readPortalCount()
      }
    }

    fetchCount()
    readPortalCount()
    window.addEventListener(CART_UPDATED_EVENT, fetchCount)
    window.addEventListener(PORTAL_CART_UPDATED_EVENT, readPortalCount)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      active = false
      window.removeEventListener(CART_UPDATED_EVENT, fetchCount)
      window.removeEventListener(PORTAL_CART_UPDATED_EVENT, readPortalCount)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  return { medusaCount, portalCount }
}

/* The nav badge shows the COMBINED count (Medusa cart + portal draft). */
export function useCartCount() {
  const { medusaCount, portalCount } = useCartCounts()
  return medusaCount + portalCount
}
