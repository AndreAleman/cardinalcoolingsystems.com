import { Text } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"
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
        className="bg-white shadow-md hover:shadow-md transition-shadow duration-200 overflow-hidden h-full flex flex-col"
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
        <div className="p-4 flex flex-col flex-grow">
          <div className="flex flex-col gap-2 flex-grow">
            <Text 
              className="text-gray-900 font-semibold text-sm line-clamp-2 min-h-[2.5rem]" 
              data-testid="product-title"
            >
              {product.title}
            </Text>
            
            {/* Product Description/Subtitle */}
            {product.description && (
              <Text className="text-gray-600 text-xs line-clamp-1 min-h-[1.25rem]">
                {product.description}
              </Text>
            )}
            
            <div className="flex items-center justify-between mt-auto pt-2">
              {/* Price */}
              <div className="flex items-center gap-x-2">
                {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
              </div>
              
              {/* View Product Button */}
              <div className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors duration-200 text-xs font-medium flex items-center gap-1">
                <span>View</span>
                <svg 
                  className="w-3 h-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 5l7 7-7 7" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
