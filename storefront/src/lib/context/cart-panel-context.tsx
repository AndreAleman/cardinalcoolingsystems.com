"use client"

import React, { createContext, useCallback, useContext, useEffect, useState } from "react"

type CartPanelContextValue = {
  isCartPanelOpen: boolean
  openCartPanel: () => void
  closeCartPanel: () => void
}

const CartPanelContext = createContext<CartPanelContextValue | null>(null)

export function CartPanelProvider({ children }: { children: React.ReactNode }) {
  const [isCartPanelOpen, setIsCartPanelOpen] = useState(false)

  const openCartPanel = useCallback(() => setIsCartPanelOpen(true), [])
  const closeCartPanel = useCallback(() => setIsCartPanelOpen(false), [])

  return (
    <CartPanelContext.Provider value={{ isCartPanelOpen, openCartPanel, closeCartPanel }}>
      {children}
    </CartPanelContext.Provider>
  )
}

export function useCartPanel() {
  const ctx = useContext(CartPanelContext)
  if (!ctx) throw new Error("useCartPanel must be used inside <CartPanelProvider>")
  return ctx
}
