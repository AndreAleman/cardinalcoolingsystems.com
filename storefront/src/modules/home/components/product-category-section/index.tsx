"use client"

type CategoryImage = {
  id: string
  src: string
  alt: string
}

type Props = {
  categoryName: string
  description: string
  images: CategoryImage[]
}

export default function ProductCategorySection({ 
  categoryName, 
  description, 
  images 
}: Props) {
  // Placeholder images if none provided
  const placeholderImages = [
    {
      id: "img-1",
      src: "/images/tube-1.jpg",
      alt: "Stainless steel tubing detail"
    },
    {
      id: "img-2", 
      src: "/images/tube-2.jpg",
      alt: "Industrial processing equipment"
    },
    {
      id: "img-3",
      src: "/images/tube-3.jpg", 
      alt: "Outdoor piping system"
    },
    {
      id: "img-4",
      src: "/images/tube-4.jpg",
      alt: "Stainless steel tank detail"
    }
  ]

  const displayImages = images.length > 0 ? images : placeholderImages

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Top Section - Title and Badge */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h2 className="text-6xl lg:text-7xl font-bold text-gray-900">
              {categoryName}
            </h2>
          </div>
          
          <div className="flex-shrink-0">
            <span className="inline-block px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 bg-white">
              Product Category
            </span>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-12 max-w-4xl">
          <p className="text-lg text-gray-600 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Photo Carousel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {displayImages.slice(0, 4).map((image) => (
            <div 
              key={image.id} 
              className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%236b7280'%3EImage%3C/text%3E%3C/svg%3E";
                }}
              />
            </div>
           ))}
        </div>

        {/* Navigation Section */}
        <div className="flex items-center justify-between">
          {/* Pagination Dots */}
          <div className="flex items-center space-x-2">
            <div className="w-12 h-1 bg-emerald-800 rounded-full"></div>
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
            <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {/* Navigation Arrows */}
          <div className="flex space-x-2">
            <button className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
            </button>
            <button className="w-12 h-12 border border-gray-300 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
