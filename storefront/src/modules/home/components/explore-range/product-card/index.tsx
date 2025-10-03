import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import Link from "next/link"

type ProductCardProps = {
  product: HttpTypes.StoreProduct | any
  region: HttpTypes.StoreRegion
}

export default function ProductCard({ product, region }: ProductCardProps) {
  const productImage = product?.thumbnail || "/placeholder-product.jpg"
  const productTitle = product?.title || "Union Hexagonal Nut"
  const productSubtitle = product?.subtitle || product?.title || "Union Hexagonal Nut"
  const productHandle = product?.handle || "#"

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // TODO: Implement add to cart functionality
    console.log("Add to cart:", product?.id)
  }

  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <Link href={`/products/${productHandle}`} className="block">
        {/* Product Image */}
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          <Image
            src={productImage}
            alt={productTitle}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        </div>
        
        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-1 text-sm">
            {productTitle}
          </h3>
          <p className="text-gray-600 text-sm mb-4">
            {productSubtitle}
          </p>
          
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-10 h-10 bg-emerald-800 text-white rounded-lg flex items-center justify-center hover:bg-emerald-900 transition-colors duration-200 ml-auto"
            aria-label="Add to cart"
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 6v6m0 0v6m0-6h6m-6 0H6" 
              />
            </svg>
          </button>
        </div>
      </Link>
    </div>
  )
}
