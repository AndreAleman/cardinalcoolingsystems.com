declare global {
  interface Window {
    dataLayer: any[]
  }
}

"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"

interface ProductViewTrackerProps {
  product: HttpTypes.StoreProduct
  selectedVariant?: HttpTypes.StoreProductVariant | null
}

export default function ProductViewTracker({ 
  product, 
  selectedVariant 
}: ProductViewTrackerProps) {
  useEffect(() => {
    if (typeof window !== 'undefined' && product) {
      const variant = selectedVariant || product.variants?.[0]
      const price = variant?.calculated_price?.calculated_amount 
        ? variant.calculated_price.calculated_amount / 100 
        : 0

      window.dataLayer = window.dataLayer || []
      window.dataLayer.push({
        event: 'view_item',
        ecommerce: {
          currency: 'USD',
          value: price,
          items: [{
            item_id: variant?.sku || product.id,
            item_name: product.title,
            item_category: product.categories?.[0]?.name || 'Uncategorized',
            price: price,
            quantity: 1
          }]
        }
      })

      console.log('✅ Product view tracked:', product.title)
    }
  }, [product.id, selectedVariant?.id])

  return null
}
