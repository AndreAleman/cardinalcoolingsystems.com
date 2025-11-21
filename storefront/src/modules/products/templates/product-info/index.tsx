// src/modules/products/templates/product-info/index.tsx
import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductSKU from "@modules/products/components/product-sku"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
  sanity?: {
    content: string
  }
}

const ProductInfo = ({ product, sanity }: ProductInfoProps) => {
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
          {product.title}
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
