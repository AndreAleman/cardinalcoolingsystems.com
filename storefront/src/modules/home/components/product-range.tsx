"use client"

import Link from "next/link"

type Product = {
  id: string
  title: string
  subtitle: string
  image: string
  handle: string
}

type Props = {
  products: Product[]
  onAdd: (id: string) => void
}

export default function ProductRange({ products, onAdd }: Props) {
  console.log("ProductRange received products:", products.length) // Debug log

  // Use dynamic products - remove placeholder fallback
  const displayProducts = products.slice(0, 4)

  // If no products, show a message instead of placeholders
  if (!products || products.length === 0) {
    return (
      <section className="py-16 px-4 bg-gray-50">
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
    <section className="py-16 px-4 bg-gray-50">
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

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
            <div key={product.id} className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Product Image */}
              <Link href={`/products/${product.handle}`}>
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
              </Link>
              
              {/* Product Info */}
              <div className="p-4">
                <Link href={`/products/${product.handle}`}>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm hover:text-blue-600 transition-colors">
                    {product.title}
                  </h3>
                </Link>
                <p className="text-gray-600 text-sm mb-4">
                  {product.subtitle}
                </p>
                
                {/* Add to Cart Button */}
                <button
                  onClick={() => onAdd(product.id)}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm font-medium"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
