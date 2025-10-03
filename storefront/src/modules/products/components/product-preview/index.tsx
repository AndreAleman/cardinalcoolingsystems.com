import { Text } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
import AddToCartButton from "../add-to-cart-button"
import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"

export default async function ProductPreview({
  product,
  isFeatured,
  region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const [pricedProduct] = await getProductsById({
    ids: [product.id!],
    regionId: region.id,
  })

  if (!pricedProduct) {
    return null
  }

  const { cheapestPrice } = getProductPrice({
    product: pricedProduct,
  })

  return (
    <LocalizedClientLink href={`/products/${product.handle}`} className="group">
      <div 
        data-testid="product-wrapper"
        className="bg-white shadow-md hover:shadow-md transition-shadow duration-200 overflow-hidden"
      >
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <Thumbnail
            thumbnail={product.thumbnail}
            images={product.images}
            size="full"
            isFeatured={isFeatured}
          />
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <div className="flex flex-col gap-2">
            <Text 
              className="text-gray-900 font-semibold text-sm line-clamp-2" 
              data-testid="product-title"
            >
              {product.title}
            </Text>
            
            {/* Product Description/Subtitle */}
            {product.description && (
              <Text className="text-gray-600 text-xs line-clamp-1">
                {product.description}
              </Text>
            )}
            
            <div className="flex items-center justify-between mt-2">
              {/* Price */}
              <div className="flex items-center gap-x-2">
                {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
              </div>
              
              {/* Add to Cart Button */}
              <AddToCartButton product={pricedProduct} />
            </div>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
