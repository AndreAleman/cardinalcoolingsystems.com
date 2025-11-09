// src/modules/products/components/product-sku/index.tsx
"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"

type ProductSKUProps = {
  product: HttpTypes.StoreProduct
}

export default function ProductSKU({ product }: ProductSKUProps) {
  const [selectedVariant, setSelectedVariant] = useState<HttpTypes.StoreProductVariant | null>(null)

  // Listen for variant selection events
  useEffect(() => {
    const handleVariantChange = (event: CustomEvent) => {
      setSelectedVariant(event.detail.variant)
    }

    window.addEventListener('variant-selected' as any, handleVariantChange)
    
    // Set default to first variant
    if (product.variants?.[0]) {
      setSelectedVariant(product.variants[0])
    }

    return () => {
      window.removeEventListener('variant-selected' as any, handleVariantChange)
    }
  }, [product])

  if (!selectedVariant) return null

  const competitorSkus = selectedVariant.metadata?.competitor_skus as string[] | undefined

  return (
    <div className="space-y-2 py-4 border-b border-ui-border-base">
      {/* Your SKU */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-ui-fg-base">SKU:</span>
        <span className="text-sm text-ui-fg-subtle font-mono">{selectedVariant.sku}</span>
      </div>

      {/* Competitor SKUs */}
      {competitorSkus && competitorSkus.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium text-ui-fg-muted whitespace-nowrap">
            Compatible Part Numbers:
          </span>
          <span className="text-xs text-ui-fg-subtle font-mono">
            {competitorSkus.join(' | ')}
          </span>
        </div>
      )}
    </div>
  )
}
