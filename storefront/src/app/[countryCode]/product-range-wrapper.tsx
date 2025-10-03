"use client"

import ProductRange from "@modules/home/components/product-range"

type Product = {
  id: string
  title: string
  subtitle: string
  image: string
  handle: string
}

type ProductRangeWrapperProps = {
  products: Product[]
}

export default function ProductRangeWrapper({ products }: ProductRangeWrapperProps) {
  const handleAdd = (productId: string) => {
    // TODO: Implement your add to cart logic here
    console.log("Adding to cart:", productId)
  }

  return <ProductRange products={products} onAdd={handleAdd} />
}
