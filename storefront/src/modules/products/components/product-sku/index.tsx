"use client"

import { useEffect, useState } from "react"
import { HttpTypes } from "@medusajs/types"

type ProductSKUProps = {
  product: HttpTypes.StoreProduct
}

export default function ProductSKU({ product }: ProductSKUProps) {
  const [selectedVariant, setSelectedVariant] = useState<HttpTypes.StoreProductVariant | null>(null)

  useEffect(() => {
    const handleVariantChange = (event: CustomEvent) => {
      setSelectedVariant(event.detail.variant)
    }
    window.addEventListener("variant-selected" as any, handleVariantChange)
    if (product.variants?.[0]) {
      setSelectedVariant(product.variants[0])
    }
    return () => {
      window.removeEventListener("variant-selected" as any, handleVariantChange)
    }
  }, [product])

  if (!selectedVariant) return null

  const competitorSkus = selectedVariant.metadata?.competitor_skus as string[] | undefined

  return (
    <div className="space-y-1.5 py-3 border-b border-gray-100">
      {/* SKU */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: "#9ca3af" }}>SKU:</span>
        <span className="text-xs font-mono font-medium" style={{ color: "#111111" }}>
          {selectedVariant.sku}
        </span>
      </div>

      {/* Competitor SKUs */}
      {competitorSkus && competitorSkus.length > 0 && (
        <div className="flex items-start gap-2">
          <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#9ca3af" }}>
            Compatible:
          </span>
          <span className="text-xs font-mono" style={{ color: "#6b7280" }}>
            {competitorSkus.join(" | ")}
          </span>
        </div>
      )}
    </div>
  )
}
