"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { addToCart } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"

type AddToCartButtonProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}

export default function AddToCartButton({ product, variant }: AddToCartButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const countryCode = useParams().countryCode as string

  // Use the passed variant or get the first variant
  const selectedVariant = variant || product.variants?.[0]

  // Check if the selected variant is in stock
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

  // Add to cart function
  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!selectedVariant?.id) return

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={!inStock || !selectedVariant || isAdding}
      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Add to cart"
    >
      {isAdding ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          Adding...
        </div>
      ) : !selectedVariant ? (
        "Select Variant"
      ) : !inStock ? (
        "Out of Stock"
      ) : (
        "Add to Cart"
      )}
    </button>
  )
}
