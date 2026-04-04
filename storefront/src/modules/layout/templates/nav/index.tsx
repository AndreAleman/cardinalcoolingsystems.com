"use client"
import { useState, useEffect, useCallback, useRef } from "react"
import Logo from "./components/logo"
import NavigationMenu from "./components/navigation-menu"
import UserActions from "./components/user-actions"
import MobileMenu from "./components/mobile-menu"

interface SearchResult {
  id: string
  title: string
  handle: string
  thumbnail?: string
  variants?: Array<{
    id: string
    sku: string
    title?: string
    options?: Array<{
      option?: { title: string }
      value: string
    }>
    metadata?: {
      competitor_skus?: string[]
    }
  }>
  [key: string]: any
}

type ExpandedResult = {
  productId: string
  productTitle: string
  productHandle: string
  productThumbnail?: string
  variant: {
    id: string
    sku: string
    options?: Array<{
      option?: { title: string }
      value: string
    }>
    metadata?: {
      competitor_skus?: string[]
    }
  }
}

interface NavProps {
  className?: string
}

export default function Nav({ className = "" }: NavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [expandedResults, setExpandedResults] = useState<ExpandedResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // ── Scroll detection ──────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // ── Focus input when search opens ─────────────────────────────────────────
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [searchOpen])

  // ── Close search on Escape ────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // ── MeiliSearch ───────────────────────────────────────────────────────────
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setExpandedResults([])
      setShowResults(false)
      return
    }
    setIsLoading(true)
    try {
      const response = await fetch(
        "https://meilisearch-production-4381.up.railway.app/indexes/products/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer 1736a63c82c45518d38d9a8e8bd378885b15c79e85e03fbb4d65bba5e4f452e1",
          },
          body: JSON.stringify({ q: searchQuery, limit: 20 }),
        }
      )
      const data = await response.json()
      const expanded: ExpandedResult[] = []
      const lowerQuery = searchQuery.toLowerCase()

      ;(data.hits || []).forEach((product: SearchResult) => {
        if (!product.variants?.length) return
        const matchingVariants = product.variants.filter(
          (variant) =>
            variant.sku?.toLowerCase().includes(lowerQuery) ||
            variant.metadata?.competitor_skus?.some((sku) =>
              sku.toLowerCase().includes(lowerQuery)
            )
        )
        const variantsToShow =
          matchingVariants.length > 0 ? matchingVariants : [product.variants[0]]

        variantsToShow.forEach((variant) => {
          expanded.push({
            productId: product.id,
            productTitle: product.title,
            productHandle: product.handle,
            productThumbnail: product.thumbnail,
            variant,
          })
        })
      })

      setExpandedResults(expanded.slice(0, 6))
      setShowResults(true)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = setTimeout(() => performSearch(query), 300)
    return () => clearTimeout(id)
  }, [query, performSearch])

  // ── Handlers ──────────────────────────────────────────────────────────────
  const closeSearch = () => {
    setSearchOpen(false)
    setQuery("")
    setExpandedResults([])
    setShowResults(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault()
      window.location.href = `/store?q=${encodeURIComponent(query)}`
    }
  }

  const handleResultClick = (result: ExpandedResult) => {
    closeSearch()
    window.location.href = `/products/${result.productHandle}?sku=${result.variant.sku}`
  }

  const handleViewAll = () => {
    window.location.href = `/store?q=${encodeURIComponent(query)}`
  }

  // ── Background state ──────────────────────────────────────────────────────
  // Transparent on top, dark metallic when scrolled or search open
  const hasDarkBg = isScrolled || searchOpen

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${className}`}
      style={{
        backgroundColor: hasDarkBg ? "rgba(180, 0, 12, 0.95)" : "rgba(0, 0, 0, 0)",
        backdropFilter: hasDarkBg ? "blur(14px)" : "none",
        borderBottom: hasDarkBg
          ? "1px solid rgba(180, 50, 50, 0.18)"
          : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="relative flex items-center h-20 lg:h-24">

          {/* ── NORMAL STATE ───────────────────────────────────────────────── */}
          <div
            className={`w-full flex items-center justify-between transition-all duration-300 ${
              searchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          >
            {/* Left — Navigation links */}
            <NavigationMenu className="hidden lg:flex flex-1" />

            {/* Center — Logo */}
            <div className="flex justify-center flex-1 lg:flex-none">
              <Logo />
            </div>

            {/* Right — Search icon + user actions + mobile menu */}
            <div className="flex items-center justify-end flex-1 gap-3 lg:gap-5">
              {/* Search button */}
              <button
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="hidden lg:flex items-center gap-1.5 text-white/90 hover:text-white transition-colors text-sm font-light tracking-wide"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                Search
              </button>

              <UserActions />
              <MobileMenu className="lg:hidden ml-2" />
            </div>
          </div>

          {/* ── SEARCH OPEN STATE ──────────────────────────────────────────── */}
          <div
            className={`absolute inset-0 flex items-center transition-all duration-300 ${
              searchOpen
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            {/* Logo — slides to left */}
            <div
              className={`flex-shrink-0 transition-all duration-300 ease-out ${
                searchOpen ? "translate-x-0 opacity-100" : "translate-x-12 opacity-0"
              }`}
            >
              <Logo />
            </div>

            {/* Search input — centered */}
            <div className="flex-1 flex justify-center px-6 lg:px-10 relative">
              <div className="w-full max-w-xl relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search by product name or SKU..."
                  className="w-full bg-white/10 text-white placeholder-white/40 border border-white/20 
                             focus:border-white/50 focus:bg-white/15 outline-none
                             px-4 py-2.5 text-sm font-light tracking-wide
                             transition-all duration-200 rounded-sm"
                />

                {/* Inline clear */}
                {query && (
                  <button
                    onClick={() => {
                      setQuery("")
                      setExpandedResults([])
                      setShowResults(false)
                      inputRef.current?.focus()
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                    aria-label="Clear"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}

                {/* Dropdown results */}
                {showResults && query && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[rgba(20,15,15,0.97)] border border-white/10 shadow-2xl z-50 max-h-80 overflow-y-auto rounded-sm">
                    {isLoading && (
                      <div className="p-4 text-center text-white/40 text-sm">Searching…</div>
                    )}
                    {!isLoading && expandedResults.length === 0 && (
                      <div className="p-4 text-center text-white/40 text-sm">
                        No results for &ldquo;{query}&rdquo;
                      </div>
                    )}
                    {!isLoading && expandedResults.length > 0 && (
                      <div className="divide-y divide-white/5">
                        {expandedResults.map((result, idx) => {
                          const variantOptions =
                            result.variant.options
                              ?.filter((o) => o.option?.title && o.value)
                              .map((o) => o.value) ?? []
                          const competitorSkus = result.variant.metadata?.competitor_skus

                          return (
                            <div
                              key={`${result.productId}-${result.variant.id}-${idx}`}
                              onClick={() => handleResultClick(result)}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors"
                            >
                              <div className="w-12 h-12 bg-white/5 rounded flex-shrink-0 overflow-hidden">
                                {result.productThumbnail ? (
                                  <img
                                    src={result.productThumbnail}
                                    alt={result.productTitle}
                                    className="w-full h-full object-contain"
                                  />
                                ) : (
                                  <svg className="w-full h-full text-white/20 p-2" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                  </svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium truncate">
                                  {result.productTitle}
                                  {variantOptions.length > 0 && (
                                    <span className="text-white/50 font-normal">
                                      {" "}{variantOptions.join(", ")}
                                    </span>
                                  )}
                                </div>
                                <div className="text-red-400 text-xs font-mono mt-0.5">
                                  SKU: {result.variant.sku}
                                </div>
                                {competitorSkus && competitorSkus.length > 0 && (
                                  <div className="text-white/30 text-xs mt-0.5 truncate">
                                    Compatible: {competitorSkus.join(", ")}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                        <button
                          onClick={handleViewAll}
                          className="w-full py-3 text-center text-red-400 hover:text-red-300 text-xs font-medium tracking-wide transition-colors"
                        >
                          View all results for &ldquo;{query}&rdquo;
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Close (X) button */}
            <button
              onClick={closeSearch}
              aria-label="Close search"
              className="flex-shrink-0 flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm font-light tracking-wide"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="hidden lg:inline">Close</span>
            </button>
          </div>

        </div>
      </div>

      {/* Click-outside to close results (not the whole search) */}
      {showResults && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowResults(false)}
        />
      )}
    </header>
  )
}
