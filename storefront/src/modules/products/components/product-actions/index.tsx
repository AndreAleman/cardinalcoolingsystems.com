"use client"

import { Button, Text } from "@medusajs/ui"
import { isEqual } from "lodash"
import { useParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"

import { useIntersection } from "@lib/hooks/use-in-view"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"

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

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
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
    if (!selectedVariant) return "Select variant"
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
        {/* Variant Selection */}
        {(product.variants?.length ?? 0) > 1 && (
          <div className="flex flex-col gap-y-4">
            <Text className="text-base font-medium text-ui-fg-base">
              Select Options
            </Text>
            {(product.options || []).map((option) => {
              return (
                <div key={option.id}>
                  <OptionSelect
                    option={option}
                    current={options[option.title ?? ""]}
                    updateOption={setOptionValue}
                    title={option.title ?? ""}
                    data-testid="product-options"
                    disabled={!!disabled || isAdding}
                  />
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
                  className="w-16 h-10 text-center border-0 focus:ring-0 focus:outline-none text-ui-fg-base bg-transparent"
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