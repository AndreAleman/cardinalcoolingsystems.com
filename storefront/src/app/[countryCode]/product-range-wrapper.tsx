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
  return <ProductRange products={products} />
}
