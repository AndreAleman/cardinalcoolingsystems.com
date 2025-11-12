"use client"

import Link from "next/link"

type Product = {
  id: string
  title: string
  subtitle: string
  image: string
  handle: string
  price?: string | number // Add price to the type
}

type Props = {
  products: Product[]
}

export default function ProductRange({ products }: Props) {
  console.log("ProductRange received products:", products.length) // Debug log

  // Use dynamic products - remove placeholder fallback
  const displayProducts = products.slice(0, 4)

  // If no products, show a message instead of placeholders
  if (!products || products.length === 0) {
    return (
      <section className="py-16 px-4 bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Explore Our Range
          </h2>
          <p className="text-lg text-gray-600">
            Featured products will appear here once configured in Medusa Admin.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 px-4 bg-white border-y border-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div className="mb-6 lg:mb-0">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Explore Our Range
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl">
              Browse our curated selection and choose the perfect fit for your project.
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <Link 
              href="/categories"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200 rounded-md"
            >
              View All Products
              <svg 
                className="ml-2 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 8l4 4m0 0l-4 4m4-4H3" 
                />
              </svg>
            </Link>
          </div>
        </div>

        {/* Product Grid - Matching ProductPreview styling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
            <Link 
              key={product.id} 
              href={`/products/${product.handle}`}
              className="group"
            >
              <div className="bg-white shadow-md hover:shadow-md transition-shadow duration-200 overflow-hidden h-full flex flex-col">
                {/* Product Image - Matching ProductPreview */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  {product.image && product.image !== "/images/placeholder.jpg" ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Product Image</span>
                    </div>
                  )}
                </div>
                
                {/* Product Info - Matching ProductPreview layout */}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex flex-col gap-2 flex-grow">
                    {/* Title - Always 2 lines with ellipsis */}
                    <h3 
                      className="text-gray-900 font-semibold text-sm line-clamp-2 min-h-[2.5rem]"
                      title={product.title}
                    >
                      {product.title}
                    </h3>
                    
                    {/* NO Description/Subtitle shown */}
                    
                    <div className="flex items-center justify-between mt-auto pt-2">
                      {/* Price */}
                      <div className="flex items-center gap-x-2">
                        {product.price && (
                          <span className="text-gray-900 font-medium text-sm">
                            {typeof product.price === 'number' 
                              ? `$${product.price.toFixed(2)}` 
                              : product.price}
                          </span>
                        )}
                      </div>
                      
                      {/* View Product Button - Matching ProductPreview */}
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
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
