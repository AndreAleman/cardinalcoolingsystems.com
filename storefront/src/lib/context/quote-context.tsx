"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

const STORAGE_KEY = "cardinal_quote_cart"

export type QuoteItem = {
  productId: string
  productTitle: string
  productHandle: string
  productThumbnail?: string
  variantId: string
  variantTitle?: string
  variantSku?: string
  variantOptions?: Array<{ title: string; value: string }>
  quantity: number
}

type QuoteContextValue = {
  quoteItems: QuoteItem[]
  quoteCount: number
  addToQuote: (item: Omit<QuoteItem, "quantity"> & { quantity?: number }) => void
  removeFromQuote: (variantId: string) => void
  updateQuoteQuantity: (variantId: string, quantity: number) => void
  clearQuote: () => void
  isQuotePanelOpen: boolean
  openQuotePanel: () => void
  closeQuotePanel: () => void
}

const QuoteContext = createContext<QuoteContextValue | null>(null)

function readStorage(): QuoteItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as QuoteItem[]) : []
  } catch {
    return []
  }
}

function writeStorage(items: QuoteItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {
    // storage unavailable — silently ignore
  }
}

export function QuoteProvider({ children }: { children: React.ReactNode }) {
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([])
  const [isQuotePanelOpen, setIsQuotePanelOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    setQuoteItems(readStorage())
    setHydrated(true)
  }, [])

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (hydrated) {
      writeStorage(quoteItems)
    }
  }, [quoteItems, hydrated])

  const addToQuote = useCallback(
    (item: Omit<QuoteItem, "quantity"> & { quantity?: number }) => {
      const qty = item.quantity ?? 1
      setQuoteItems((prev) => {
        const existing = prev.find((i) => i.variantId === item.variantId)
        if (existing) {
          return prev.map((i) =>
            i.variantId === item.variantId
              ? { ...i, quantity: i.quantity + qty }
              : i
          )
        }
        return [...prev, { ...item, quantity: qty }]
      })
      setIsQuotePanelOpen(true)
    },
    []
  )

  const removeFromQuote = useCallback((variantId: string) => {
    setQuoteItems((prev) => prev.filter((i) => i.variantId !== variantId))
  }, [])

  const updateQuoteQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (quantity < 1) return
      setQuoteItems((prev) =>
        prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
      )
    },
    []
  )

  const clearQuote = useCallback(() => {
    setQuoteItems([])
  }, [])

  const openQuotePanel = useCallback(() => setIsQuotePanelOpen(true), [])
  const closeQuotePanel = useCallback(() => setIsQuotePanelOpen(false), [])

  const quoteCount = quoteItems.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <QuoteContext.Provider
      value={{
        quoteItems,
        quoteCount,
        addToQuote,
        removeFromQuote,
        updateQuoteQuantity,
        clearQuote,
        isQuotePanelOpen,
        openQuotePanel,
        closeQuotePanel,
      }}
    >
      {children}
    </QuoteContext.Provider>
  )
}

export function useQuote() {
  const ctx = useContext(QuoteContext)
  if (!ctx) {
    throw new Error("useQuote must be used inside <QuoteProvider>")
  }
  return ctx
}
