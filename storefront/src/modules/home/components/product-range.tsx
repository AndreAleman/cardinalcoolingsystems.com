"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useRef } from "react"

type Product = {
  id: string
  title: string
  subtitle: string
  image: string
  handle: string
  variantId?: string
  price?: string | number
  inStock?: boolean
}

type Props = {
  products: Product[]
}

export default function ProductRange({ products }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = () => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return
    const cardWidth = scrollRef.current.querySelector("[data-card]")?.clientWidth ?? 300
    scrollRef.current.scrollBy({
      left: direction === "left" ? -(cardWidth + 24) : cardWidth + 24,
      behavior: "smooth",
    })
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 text-center">
          <h2 className="text-3xl font-normal text-gray-900 mb-2">Featured Products</h2>
          <p className="text-gray-400 font-light">Products will appear here once configured.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 lg:py-24 bg-white border-b border-gray-100" id="products">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 lg:mb-14">
          <h2 className="font-sans text-2xl lg:text-4xl font-normal tracking-tight text-gray-900">
            Featured Products
          </h2>
<Link
  href="/store"
  className="flex items-center gap-3 pl-5 pr-2 py-2 text-sm font-semibold text-white transition-all duration-200"
  style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d")}
  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F")}
>
  All Products
  <span
    className="flex items-center justify-center w-8 h-8"
    style={{ backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "3px" }}
  >
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 12L12 2M12 2H5M12 2v7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
</Link>
        </div>

        {/* Carousel */}
        <div className="relative">

          {/* Left arrow */}
          {canScrollLeft && (
<button
  onClick={() => scroll("left")}
  className="absolute left-0 top-[130px] -translate-y-1/2 -translate-x-5 z-10 w-12 h-12  flex items-center justify-center text-white transition-all duration-200 hover:scale-105  ring-4 ring-white"
              style={{ backgroundColor: "#E3000F", borderRadius: "50%" }}
              aria-label="Previous"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Right arrow */}
          {canScrollRight && (
<button
  onClick={() => scroll("right")}
  className="absolute right-0 top-[130px] -translate-y-1/2 translate-x-5 z-10 w-12 h-12  flex items-center justify-center text-white shadow-lg transition-all duration-200 hover:scale-105 ring-4 ring-white"
  style={{ backgroundColor: "#E3000F", borderRadius: "50%" }}
  aria-label="Next"
>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Scrollable cards */}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-none scroll-smooth"
          >
            {products.map((product, idx) => (
              <div
                key={product.id}
                data-card
                className="group flex-shrink-0 w-[80vw] sm:w-[45vw] lg:w-[calc(25%-18px)]"
              >
                {/* Image — fixed square, object-cover, no padding, no border */}
                <div
                  className="relative overflow-hidden"
                  style={{ borderRadius: "5px", height: "260px" }}
                >
                  <Link href={`/products/${product.handle}`} className="block w-full h-full">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        sizes="(max-width: 640px) 80vw, (max-width: 1024px) 45vw, 25vw"
                        loading={idx < 2 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                      </div>
                    )}
                  </Link>

                  {/* Basket — always visible, bottom right */}
                  <Link
                    href={`/products/${product.handle}`}
                    aria-label="View product"
                    className="absolute bottom-0 right-0 w-12 h-12 flex items-center justify-center text-white"
                    style={{ backgroundColor: "#E3000F", borderRadius: "5px 0 5px 0" }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                    </svg>
                  </Link>
                </div>

{/* Text below image */}
<div className="pt-4 px-1 flex flex-col">
  <Link href={`/products/${product.handle}`}>
    <h3 className="font-sans text-base font-semibold text-gray-900 leading-snug mb-1 group-hover:text-red-600 transition-colors duration-200 line-clamp-2 min-h-[2.5rem]">
      {product.title}
    </h3>
  </Link>
  {product.subtitle && (
    <p className="text-sm text-gray-400 font-light mb-2 line-clamp-1">
      {product.subtitle}
    </p>
  )}
  {product.price != null && product.price !== "" ? (
    <p className="text-sm font-semibold text-gray-900">
      {typeof product.price === "number"
        ? `Starting at $${product.price.toFixed(2)}`
        : product.price}
    </p>
  ) : (
    <p className="text-sm text-gray-400">Contact for price</p>
  )}
</div>

              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
