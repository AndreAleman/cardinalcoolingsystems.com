"use client"

/*
  Shared client state for the Quick Order's in-progress lines, so the
  Orders ("Order Again") and Favorites surfaces can add parts into the
  same draft the Quick Order table shows. Hydrates from localStorage
  after mount (hydration-ref pattern — the server render must match the
  first client render) and persists on every change.
*/

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import type { PortalCartLine } from "@modules/account/components/quick-order/money-rules"
import {
  loadStoredCartLines,
  saveStoredCartLines,
} from "@modules/account/components/quick-order/cart-storage"

type PortalCartContextValue = {
  lines: PortalCartLine[]
  addLine: (line: PortalCartLine) => void
  updateQty: (variantId: string, qty: number) => void
  removeLine: (variantId: string) => void
  clear: () => void
  setLines: React.Dispatch<React.SetStateAction<PortalCartLine[]>>
}

const PortalCartContext = createContext<PortalCartContextValue | null>(null)

export function PortalCartProvider({
  companyId,
  children,
}: {
  companyId: string
  children: React.ReactNode
}) {
  const [lines, setLines] = useState<PortalCartLine[]>([])
  const hydrated = useRef(false)

  useEffect(() => {
    const stored = loadStoredCartLines(companyId)
    if (stored.length) setLines(stored)
    hydrated.current = true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId])

  useEffect(() => {
    if (!hydrated.current) return
    saveStoredCartLines(companyId, lines)
  }, [companyId, lines])

  const addLine = useCallback((line: PortalCartLine) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === line.variantId)
      if (existing) {
        return prev.map((l) =>
          l.variantId === line.variantId ? { ...l, qty: l.qty + line.qty } : l
        )
      }
      return [...prev, line]
    })
  }, [])

  const updateQty = useCallback((variantId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, qty } : l))
    )
  }, [])

  const removeLine = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  return (
    <PortalCartContext.Provider
      value={{ lines, addLine, updateQty, removeLine, clear, setLines }}
    >
      {children}
    </PortalCartContext.Provider>
  )
}

export function usePortalCart(): PortalCartContextValue {
  const ctx = useContext(PortalCartContext)
  if (!ctx) {
    throw new Error("usePortalCart must be used inside PortalCartProvider")
  }
  return ctx
}
