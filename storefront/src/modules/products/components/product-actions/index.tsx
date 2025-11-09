"use client"

import { Button, Text } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import { clsx } from "clsx"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"

import MobileActions from "./mobile-actions"
import ProductPrice from "../product-price"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
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
}: ProductActionsProps) {
  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (title: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [title]: value,
    }))
  }

  // Get available option values based on currently selected options (dependent filtering)
  const getAvailableOptionValues = (optionTitle: string) => {
    const values = new Set<string>()
    
    // Get other selected options (excluding the current one)
    const otherSelectedOptions = Object.entries(options).reduce((acc, [key, val]) => {
      if (key !== optionTitle && val) {
        acc[key] = val
      }
      return acc
    }, {} as Record<string, string>)

    // Filter variants based on other selected options
    product.variants?.forEach((variant) => {
      const variantOptions = optionsAsKeymap(variant.options)
      
      // Check if this variant matches all other selected options
      const matchesOtherOptions = Object.entries(otherSelectedOptions).every(
        ([key, value]) => variantOptions[key] === value
      )
      
      // If it matches, add this variant's value for the current option
      if (matchesOtherOptions && variantOptions[optionTitle]) {
        values.add(variantOptions[optionTitle])
      }
    })
    
    // Sort the values
    return Array.from(values).sort((a, b) => {
      // Try to sort numerically first
      const numA = parseFloat(a.replace(/[^0-9.]/g, ''))
      const numB = parseFloat(b.replace(/[^0-9.]/g, ''))
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB
      }
      return a.localeCompare(b)
    })
  }

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    if (selectedVariant?.allow_backorder) {
      return true
    }

    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    return false
  }, [selectedVariant])

  // Get available stock quantity
  const availableStock = useMemo(() => {
    if (!selectedVariant?.manage_inventory) return null
    return selectedVariant?.inventory_quantity || 0
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)
  const inView = useIntersection(actionsRef, "0px")

  // Handle quantity changes
  const handleQuantityChange = (newQuantity: number) => {
    const maxQuantity = availableStock || 999
    const validQuantity = Math.max(1, Math.min(newQuantity, maxQuantity))
    setQuantity(validQuantity)
  }

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: quantity,
        countryCode,
      })
    } catch (error) {
      console.error("Failed to add to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  // Get button text based on state
  const getButtonText = () => {
    if (!selectedVariant) return "Select options"
    if (!inStock) return "Out of stock"
    if (isAdding) return "Adding to cart..."
    return `Add ${quantity} to cart`
  }

  // Get stock status message
  const getStockStatus = () => {
    if (!selectedVariant) return null
    if (!inStock) return { message: "Out of stock", color: "text-red-600" }
    if (availableStock && availableStock <= 5) {
      return { message: `Only ${availableStock} left in stock`, color: "text-orange-600" }
    }
    if (availableStock) {
      return { message: `${availableStock} in stock`, color: "text-green-600" }
    }
    return { message: "In stock", color: "text-green-600" }
  }

  const stockStatus = getStockStatus()

  return (
    <>
      <div className="flex flex-col gap-y-6" ref={actionsRef}>
        {/* Variant Selection - Dropdown Style with Dependent Filtering */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-4">
            <Text className="text-base font-medium text-ui-fg-base">
              Select Options
            </Text>
            {(product.options || []).map((option) => {
              const availableValues = getAvailableOptionValues(option.title ?? "")
              const currentValue = options[option.title ?? ""]
              
              // Reset selection if current value is no longer available
              useEffect(() => {
                if (currentValue && !availableValues.includes(currentValue)) {
                  setOptionValue(option.title ?? "", "")
                }
              }, [availableValues, currentValue])
              
              return (
                <div key={option.id} className="flex flex-col gap-y-2">
                  <label htmlFor={`option-${option.id}`} className="text-sm font-medium text-ui-fg-base">
                    {option.title}
                  </label>
                  <select
                    id={`option-${option.id}`}
                    value={currentValue || ""}
                    onChange={(e) => setOptionValue(option.title ?? "", e.target.value)}
                    disabled={!!disabled || isAdding || availableValues.length === 0}
                    className={clsx(
                      "w-full px-4 py-3 rounded-md border text-ui-fg-base bg-ui-bg-base",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      !currentValue && "text-ui-fg-subtle"
                    )}
                    data-testid="product-options"
                  >
                    <option value="" disabled>
                      {availableValues.length === 0 
                        ? `No ${option.title} available` 
                        : `Select ${option.title}`
                      }
                    </option>
                    {availableValues.map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
            <Divider className="my-2" />
          </div>
        )}

        {/* Price */}
        <div className="flex flex-col gap-y-2">
          <ProductPrice product={product} variant={selectedVariant} />
          
          {/* Stock Status */}
          {stockStatus && (
            <Text className={`text-sm font-medium ${stockStatus.color}`}>
              {stockStatus.message}
            </Text>
          )}
        </div>

        {/* Quantity Selector */}
        {selectedVariant && inStock && (
          <div className="flex flex-col gap-y-3">
            <Text className="text-base font-medium text-ui-fg-base">
              Quantity
            </Text>
            <div className="flex items-center gap-x-3">
              <div className="flex items-center border border-ui-border-base rounded-md">
                <button
                  onClick={() => handleQuantityChange(quantity - 1)}
                  disabled={quantity <= 1 || disabled || isAdding}
                  className="w-10 h-10 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                
                <input
                  type="number"
                  min="1"
                  max={availableStock || 999}
                  value={quantity}
                  onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                  disabled={disabled || isAdding}
                  className="w-16 h-10 text-center border-0 focus:ring-0 focus:outline-none text-ui-fg-base bg-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                
                <button
                  onClick={() => handleQuantityChange(quantity + 1)}
                  disabled={
                    (availableStock && quantity >= availableStock) || 
                    disabled || 
                    isAdding
                  }
                  className="w-10 h-10 flex items-center justify-center text-ui-fg-base hover:bg-ui-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
              
              {availableStock && availableStock < 999 && (
                <Text className="text-sm text-ui-fg-subtle">
                  Max: {availableStock}
                </Text>
              )}
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        <Button
          onClick={handleAddToCart}
          disabled={!inStock || !selectedVariant || !!disabled || isAdding}
          variant="primary"
          className="w-full h-12 text-base font-medium"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {getButtonText()}
        </Button>

        {/* Additional Info */}
        {selectedVariant && inStock && (
          <div className="flex flex-col gap-y-2 pt-2 border-t border-ui-border-base">
            <div className="flex items-center gap-x-2 text-sm text-ui-fg-subtle">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Free shipping on orders over $100</span>
            </div>
            <div className="flex items-center gap-x-2 text-sm text-ui-fg-subtle">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Usually ships within 1-2 business days</span>
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
