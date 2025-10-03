"use client"

type ProductItem = {
  id: string
  title: string
  description: string
  learnMoreUrl?: string
}

type Props = {
  products?: ProductItem[]
}

export default function SanitaryProducts({ products }: Props) {
  // Default product data
  const defaultProducts = [
    {
      id: "tube",
      title: "Tube",
      description: "Cowbird Depot welded stainless steel tubing is engineered to meet the American Society for Testing and Materials (ASTM) type A269 unpolished and A270 polished designations.",
      learnMoreUrl: "/categories/tube"
    },
    {
      id: "valves", 
      title: "Valves",
      description: "Cowbird Depot features a full line of industrial and sanitary (clamp-end) stainless steel valves. Designed to comply with all US and international quality and dimensional standards",
      learnMoreUrl: "/categories/valves"
    },
    {
      id: "fittings",
      title: "Fittings", 
      description: "Cowbird Depot stainless steel fittings are designed for a wide range of sanitary processing and industrial applications. Take a look around at our extensive inventory of both",
      learnMoreUrl: "/categories/fittings"
    }
  ]

  const displayProducts = products || defaultProducts

  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-8">
          Sanitary Stainless Steel Products
        </h2>

        {/* Full Width Description Container */}
        <div className="mb-16">
          <p className="text-lg text-gray-600 leading-relaxed">
            Discover Cowbird Depot's premium stainless steel solutions, including welded tubing, valves, and 
            fittings. Engineered to meet ASTM standards, our products ensure durability, compliance, and 
            performance for both sanitary and industrial applications.
          </p>
        </div>

        {/* Two Column Layout - Products Left, Single Photo Right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          {/* Left Column - Product List */}
          <div className="space-y-12">
            {displayProducts.map((product) => (
              <div key={product.id} className="border-l-4 border-[#0f62fe] pl-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {product.title}
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  {product.description}
                </p>
                <a 
                  href={product.learnMoreUrl || "#"}
                  className="inline-flex items-center text-[#0f62fe] font-medium hover:opacity-80 transition-opacity"
                >
                  Learn more
                  <svg 
                    className="ml-2 w-4 h-4" 
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
                </a>
              </div>
            ))}
          </div>

          {/* Right Column - Single Photo */}
          <div className="lg:pl-8">
            <div className="aspect-[4/3] bg-gray-100 overflow-hidden rounded-lg">
              <img
                src="/images/sanitary-products/sanitary-products.jpg"
                alt="Industrial stainless steel equipment"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23f3f4f6'/%3E%3Ctext x='400' y='300' text-anchor='middle' dy='.3em' font-family='Arial' font-size='18' fill='%236b7280'%3EIndustrial Equipment Image%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
   )
}
