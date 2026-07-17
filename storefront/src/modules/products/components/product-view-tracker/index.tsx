"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { captureEvent } from "@lib/util/posthog"

declare global {
  interface Window {
    dataLayer: any[]
  }
}

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
      // Medusa stores prices as-is (49.99 is stored as 49.99, not cents)
      const price = variant?.calculated_price?.calculated_amount ?? 0

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

      captureEvent('product_viewed', {
        page_type: 'product',
        product_id: product.id,
        product_title: product.title,
        product_handle: product.handle,
        variant_sku: variant?.sku,
        category: product.categories?.[0]?.name,
        price,
      })
    }
  }, [product.id, selectedVariant?.id])

  return null
}
