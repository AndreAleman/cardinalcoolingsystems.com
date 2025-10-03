import { HttpTypes } from "@medusajs/types"
import ProductCard from "../product-card"

type ProductGridProps = {
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
}

export default function ProductGrid({ products, region }: ProductGridProps) {
  // If no products, show placeholder cards
  const displayProducts = products.length > 0 ? products : Array(4).fill(null).map((_, index) => ({
    id: `placeholder-${index}`,
    title: "Union Hexagonal Nut",
    subtitle: "Union Hexagonal Nut",
    thumbnail: "/placeholder-product.jpg",
    handle: `placeholder-${index}`,
  }))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {displayProducts.slice(0, 4).map((product, index) => (
        <ProductCard
          key={product?.id || index}
          product={product}
          region={region}
        />
      ))}
    </div>
  )
}
