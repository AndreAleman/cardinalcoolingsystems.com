"use client"

import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { useIntersection } from "@lib/hooks/use-in-view"
import MobileActions from "./mobile-actions"
import ProductPrice from "../product-price"
import BulkPricingModal from "../bulk-pricing-modal"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  selectedVariant?: HttpTypes.StoreProductVariant | null
}

const optionsAsKeymap = (variantOptions: any) => {
  return variantOptions?.reduce((acc: Record<string, string | undefined>, varopt: any) => {
    if (varopt.option && varopt.value !== null && varopt.value !== undefined) {
      acc[varopt.option.title] = varopt.value
    }
    return acc
  }, {})
}

export default function ProductActions({
  product,
  region,
  disabled,
  selectedVariant: initialSelectedVariant,
}: ProductActionsProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [bulkModalOpen, setBulkModalOpen] = useState(false)
  const countryCode = useParams().countryCode as string

  useEffect(() => {
    if (initialSelectedVariant) {
      const variantOptions = optionsAsKeymap(initialSelectedVariant.options)
      setOptions(variantOptions ?? {})
    } else if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [initialSelectedVariant, product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return
    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    if (selectedVariant && Object.keys(options).length > 0) {
      const params = new URLSearchParams()
      selectedVariant.options?.forEach((opt: any) => {
        if (opt.option?.title && opt.value) {
          const optionName = opt.option.title.toLowerCase()
          let optionValue = opt.value.toLowerCase()
          optionValue = optionValue.replace(/["'']/g, "in").replace(/\s+/g, "")
          params.set(optionName, optionValue)
        }
      })
      const queryString = params.toString()
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname
      if (queryString !== searchParams.toString()) {
        window.history.replaceState(null, "", newUrl)
      }
      window.dispatchEvent(new CustomEvent("variant-selected", { detail: { variant: selectedVariant } }))
    }
  }, [selectedVariant, pathname, options, searchParams])

  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({ ...prev, [title]: value }))
  }

  const getAvailableOptionValues = (optionTitle: string) => {
    const values = new Set<string>()
    const otherSelectedOptions = Object.entries(options).reduce((acc, [key, val]) => {
      if (key !== optionTitle && val) acc[key] = val
      return acc
    }, {} as Record<string, string>)

    product.variants?.forEach((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      const matchesOtherOptions = Object.entries(otherSelectedOptions).every(
        ([key, value]) => variantOptions[key] === value
      )
      if (matchesOtherOptions && variantOptions[optionTitle]) {
        values.add(variantOptions[optionTitle])
      }
    })

    return Array.from(values).sort((a, b) => {
      const numA = parseFloat(a.replace(/[^0-9.]/g, ""))
      const numB = parseFloat(b.replace(/[^0-9.]/g, ""))
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })
  }

  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) return true
    if (selectedVariant?.allow_backorder) return true
    if (selectedVariant?.manage_inventory && (selectedVariant?.inventory_quantity || 0) > 0) return true
    return false
  }, [selectedVariant])

  const availableStock = useMemo(() => {
    if (!selectedVariant?.manage_inventory) return null
    return selectedVariant?.inventory_quantity || 0
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  const handleQuantityChange = (newQuantity: number) => {
    const maxQuantity = availableStock || 999
    setQuantity(Math.max(1, Math.min(newQuantity, maxQuantity)))
  }

  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return
    setIsAdding(true)
    try {
      await addToCart({ variantId: selectedVariant.id, quantity, countryCode })
      if (typeof window !== "undefined") {
        window.dataLayer = window.dataLayer || []
        window.dataLayer.push({
          event: "add_to_cart",
          ecommerce: {
            currency: "USD",
            value: (selectedVariant.calculated_price?.calculated_amount || 0) * quantity,
            items: [{
              item_id: selectedVariant.sku || selectedVariant.id,
              item_name: product.title,
              item_category: product.categories?.[0]?.name || "Uncategorized",
              price: selectedVariant.calculated_price?.calculated_amount || 0,
              quantity,
            }],
          },
        })
      }
      toast.success(`✓ Added ${quantity} ${quantity > 1 ? "items" : "item"} to cart!`, {
        position: "bottom-right",
        autoClose: 3000,
      })
      setQuantity(1)
    } catch (error) {
      console.error("Failed to add to cart:", error)
      toast.error("Failed to add item to cart. Please try again.", { position: "bottom-right", autoClose: 3000 })
    } finally {
      setIsAdding(false)
    }
  }

  const stockStatus = useMemo(() => {
    if (!selectedVariant) return null
    if (!inStock) return { message: "Out of stock", color: "#dc2626" }
    if (availableStock && availableStock <= 5) return { message: `Only ${availableStock} left`, color: "#d97706" }
    if (availableStock) return { message: `${availableStock} in stock`, color: "#16a34a" }
    return { message: "In stock", color: "#16a34a" }
  }, [selectedVariant, inStock, availableStock])

  return (
    <>
      <ToastContainer />
      <BulkPricingModal isOpen={bulkModalOpen} onClose={() => setBulkModalOpen(false)} />

      <div className="flex flex-col gap-y-6" ref={actionsRef}>

        {/* Price */}
        <ProductPrice product={product} variant={selectedVariant} />

        {/* Option selectors — 2 col grid with custom arrow */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-4">
            <p className="text-sm font-medium" style={{ color: "#111111" }}>Select Options</p>
            <div className={`grid gap-3 ${(product.options?.length ?? 0) >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
              {(product.options || []).map((option) => {
                const availableValues = getAvailableOptionValues(option.title ?? "")
                const currentValue = options[option.title ?? ""]
                return (
                  <div key={option.id} className="flex flex-col gap-y-1.5">
                    <label htmlFor={`option-${option.id}`} className="text-xs font-medium" style={{ color: "#6b7280" }}>
                      {option.title}
                    </label>
                    {/* Wrapper for custom chevron */}
                    <div className="relative">
                      <select
                        id={`option-${option.id}`}
                        value={currentValue || ""}
                        onChange={(e) => setOptionValue(option.title ?? "", e.target.value)}
                        disabled={!!disabled || isAdding || availableValues.length === 0}
                        className="w-full px-3 py-2.5 pr-9 text-sm border border-gray-200 bg-white focus:outline-none focus:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
                        style={{ borderRadius: "5px", color: currentValue ? "#111111" : "#9ca3af" }}
                        data-testid="product-options"
                      >
                        <option value="" disabled>
                          {availableValues.length === 0 ? `No ${option.title}` : `Select ${option.title}`}
                        </option>
                        {availableValues.map((value) => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                      {/* Custom chevron */}
                      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                        <svg className="w-4 h-4" style={{ color: "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quantity + stock */}
        {selectedVariant && inStock && (
          <div className="flex flex-col gap-y-2">
            <p className="text-sm font-medium" style={{ color: "#111111" }}>Quantity</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center border border-gray-200" style={{ borderRadius: "5px" }}>
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || !!disabled || isAdding}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  max={availableStock || 999}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  disabled={!!disabled || isAdding}
                  className="w-12 h-10 text-center text-sm font-medium border-0 focus:ring-0 focus:outline-none bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ color: "#111111" }}
                />
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={(!!availableStock && quantity >= availableStock) || !!disabled || isAdding}
                  className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>

              {stockStatus && (
                <span className="text-sm font-medium px-3 py-1.5 border" style={{ color: stockStatus.color, borderColor: stockStatus.color, borderRadius: "5px", backgroundColor: `${stockStatus.color}10` }}>
                  {stockStatus.message}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col gap-y-3">
          <div className="flex gap-3">
            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={!inStock || !selectedVariant || !!disabled || isAdding}
              className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              onMouseEnter={(e) => { if (!isAdding) (e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F" }}
              data-testid="add-product-button"
            >
              {isAdding ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {!selectedVariant ? "Select options" : !inStock ? "Out of stock" : "Add To Cart"}
                  {selectedVariant && inStock && (
                    <span className="flex items-center justify-center w-5 h-5" style={{ backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "4px" }}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Unlock Bulk Pricing */}
            <button
              onClick={() => setBulkModalOpen(true)}
              className="flex-1 h-12 flex items-center justify-center gap-2 text-sm font-semibold border-2 transition-all duration-200"
              style={{ color: "#E3000F", borderColor: "#E3000F", borderRadius: "5px" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(227,0,15,0.05)" }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "transparent" }}
            >
              Unlock Bulk Pricing
              <span className="flex items-center justify-center w-5 h-5" style={{ backgroundColor: "rgba(227,0,15,0.1)", borderRadius: "4px" }}>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </span>
            </button>
          </div>

          <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
            Excludes freight shipments. Call or email for custom rates above 5%.
          </p>
        </div>

        {/* Trust badges */}
        {selectedVariant && inStock && (
          <div className="flex flex-col gap-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-x-2.5">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(227,0,15,0.08)", borderRadius: "4px" }}>
                <svg className="w-3.5 h-3.5" style={{ color: "#E3000F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              </div>
              <span className="text-sm" style={{ color: "#374151" }}>
                <strong className="font-medium">Free shipping</strong> on orders over $100
              </span>
            </div>
            <div className="flex items-center gap-x-2.5">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "rgba(227,0,15,0.08)", borderRadius: "4px" }}>
                <svg className="w-3.5 h-3.5" style={{ color: "#E3000F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                </svg>
              </div>
              <span className="text-sm" style={{ color: "#374151" }}>
                Usually ships within <strong className="font-medium">1-2 business days</strong>
              </span>
            </div>
          </div>
        )}

        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
