"use client"

import { useState, useEffect } from "react"

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

export function useCartCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true

    const fetchCount = async () => {
      try {
        const res = await fetch("/api/cart/count")
        if (!res.ok) return
        const data = await res.json()
        if (active) setCount(data.count || 0)
      } catch {
        // Transient network failure — keep the last known count
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchCount()
    }

    fetchCount()
    window.addEventListener(CART_UPDATED_EVENT, fetchCount)
    document.addEventListener("visibilitychange", onVisibilityChange)

    return () => {
      active = false
      window.removeEventListener(CART_UPDATED_EVENT, fetchCount)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])

  return count
}
