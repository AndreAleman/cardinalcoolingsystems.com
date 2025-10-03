"use client"

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
  // Placeholder products as fallback
  const placeholderProducts = [
    {
      id: "placeholder-1",
      title: "Union Hexagonal Nut",
      subtitle: "Union Hexagonal Nut",
      image: "/images/placeholder.jpg",
      handle: "union-hexagonal-nut-1"
    },
    {
      id: "placeholder-2", 
      title: "Union Hexagonal Nut",
      subtitle: "Union Hexagonal Nut",
      image: "/images/placeholder.jpg",
      handle: "union-hexagonal-nut-2"
    },
    {
      id: "placeholder-3",
      title: "Union Hexagonal Nut", 
      subtitle: "Union Hexagonal Nut",
      image: "/images/placeholder.jpg",
      handle: "union-hexagonal-nut-3"
    },
    {
      id: "placeholder-4",
      title: "Union Hexagonal Nut",
      subtitle: "Union Hexagonal Nut", 
      image: "/images/placeholder.jpg",
      handle: "union-hexagonal-nut-4"
    }
  ]

  // Use real products if available, otherwise use placeholders - FIXED THE SAFETY CHECK
  const displayProducts = (products && products.length > 0) ? products.slice(0, 4) : placeholderProducts

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
            <button className="inline-flex items-center px-6 py-3 bg-emerald-800 text-white font-medium hover:bg-emerald-900 transition-colors duration-200">
              View All Product
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
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayProducts.map((product) => (
            <div key={product.id} className="group bg-white shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
              {/* Product Image */}
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
              
              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">
                  {product.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {product.subtitle}
                </p>
                
                {/* Add to Cart Button */}
                <button
                  onClick={() => onAdd(product.id)}
                  className="w-10 h-10 bg-emerald-800 text-white flex items-center justify-center hover:bg-emerald-900 transition-colors duration-200 ml-auto"
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
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        <div className="flex items-center justify-center mt-8 space-x-2">
          <div className="w-8 h-1 bg-emerald-800"></div>
          <div className="w-8 h-1 bg-gray-300"></div>
        </div>
        
        {/* Navigation Arrows */}
        <div className="flex justify-end mt-4 space-x-2">
          <button className="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          </button>
          <button className="w-10 h-10 border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  )
}
