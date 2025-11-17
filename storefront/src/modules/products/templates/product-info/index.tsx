// src/modules/products/templates/product-info/index.tsx
"use client"

import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductSKU from "@modules/products/components/product-sku"
import { useParams, useSearchParams } from "next/navigation"
import { useMemo } from "react"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  sanity?: {
    content: string
  }
}

const ProductInfo = ({ product, sanity }: ProductInfoProps) => {
  const searchParams = useSearchParams()
  
  // Build dynamic title based on selected options
  const dynamicTitle = useMemo(() => {
    // Get current option selections from URL
    const selectedOptions: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      selectedOptions[key.toLowerCase()] = value
    })

    // If no options selected, return base title
    if (Object.keys(selectedOptions).length === 0) {
      return product.title
    }

    // Find the variant matching current selections
    const selectedVariant = product.variants?.find((variant: any) => {
      return variant.options?.every((opt: any) => {
        const optionName = opt.option.title.toLowerCase()
        const optionValue = opt.value.toLowerCase()
        const searchValue = selectedOptions[optionName]?.toLowerCase()
        return searchValue === optionValue
      })
    })

    if (!selectedVariant) {
      return product.title
    }

    // Build title: "{option1} {option2} {option3} {productTitle}"
    const optionValues = selectedVariant.options
      ?.map((opt: any) => opt.value)
      .join(" ")

    return optionValues ? `${optionValues} ${product.title}` : product.title
  }, [product, searchParams])

  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 lg:max-w-[500px] mx-auto">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-medium text-ui-fg-muted hover:text-ui-fg-subtle"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="text-3xl leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {dynamicTitle}
        </Heading>

        {/* SKU Display - Dynamic with variant selection */}
        <ProductSKU product={product} />

        <Text
          className="text-medium text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {sanity?.content || product.description}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
