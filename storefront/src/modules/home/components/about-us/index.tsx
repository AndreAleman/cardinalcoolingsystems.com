"use client"

type Props = {
  title?: string
  description?: string
  readMoreUrl?: string
}

export default function AboutUs({ 
  title = "About Us",
  description = "Welcome to Cowbird Depot™, the leading manufacturer of sanitary-grade stainless steel tube, valves, and fittings. Cowbird Depot products are precision engineered to meet 3A specifications and to withstand the most challenging operating environments in the food, dairy, beverage, cosmetic, pharmaceutical, and industrial markets.",
  readMoreUrl = "/about"
}: Props) {
  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* Left Column - Content */}
          <div>
            {/* Blue accent line */}
            <div className="w-16 h-1 bg-[#0f62fe] mb-6"></div>
            
            {/* Main heading */}
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              {title}
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              {description}
            </p>

            {/* Read more button */}
            <a 
              href={readMoreUrl}
              className="inline-flex items-center px-8 py-4 bg-[#0f62fe] text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Read more
              <svg 
                className="ml-3 w-5 h-5" 
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

{/* Right Column - Enhanced Photo Layout */}
<div className="relative">
  {/* Decorative element - blue square behind main image, aligned with photos */}
  <div className="absolute -top-4 -right-4 w-32 h-32 bg-[#0f62fe] opacity-25"></div>

  {/* Main background photo with shadow */}
  <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden rounded-2xl shadow-2xl">
    <img
      src="/images/about/about-main.jpg"
      alt="Industrial stainless steel equipment"
      className="w-full h-full object-cover"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='450' viewBox='0 0 600 450'%3E%3Crect width='600' height='450' fill='%23f3f4f6'/%3E%3Ctext x='300' y='225' text-anchor='middle' dy='.3em' font-family='Arial' font-size='18' fill='%236b7280'%3EMain Industrial Image%3C/text%3E%3C/svg%3E";
      }}
    />
  </div>

  {/* Enhanced overlapping photo with tiny border - moved more diagonally */}
  <div className="absolute -bottom-8 -left-8 w-1/2 aspect-square bg-white p-0.5 rounded-2xl shadow-xl">
    <div className="w-full h-full bg-gray-100 overflow-hidden rounded-xl">
      <img
        src="/images/about/about-detail.jpg"
        alt="Stainless steel fittings detail"
        className="w-full h-full object-cover"
        onError={(e ) => {
          const target = e.target as HTMLImageElement;
          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23f3f4f6'/%3E%3Ctext x='150' y='150' text-anchor='middle' dy='.3em' font-family='Arial' font-size='14' fill='%236b7280'%3EDetail Image%3C/text%3E%3C/svg%3E";
        }}
      />
    </div>
  </div>
</div>


        </div>
      </div>
    </section>
  )
}
