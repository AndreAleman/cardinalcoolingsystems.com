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


  return (
    <div className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
      <Link href={`/us/products/${productHandle}`} className="block">
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
          
          {/* View Product Button */}
          <div className="w-full bg-emerald-800 text-white rounded-lg px-4 py-2 flex items-center justify-center gap-2 group-hover:bg-emerald-900 transition-colors duration-200">
            <span className="text-sm font-medium">View Product</span>
            <svg 
              className="w-4 h-4" 
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
      </Link>
    </div>
  )
}
