"use client"

import Link from "next/link"

const industries = [
  {
    id: "data-center-cooling",
    title: "Data Center Cooling",
    subtitle: "Liquid Cooling Solutions",
    description: "High-performance stainless steel tubing for next-generation AI workloads and liquid cooling systems. Supporting the infrastructure powering tomorrow's technology.",
    growth: "19.6% growth in 2025",
    applications: ["Liquid cooling loops", "Heat exchangers", "Thermal management", "Server rack cooling"],
    image: "/images/industries/data-center-cooling.jpg",
    imageAlt: "Data center server room with cooling systems",
    bgColor: "bg-red-50",
    iconColor: "text-[#B80C09]",
    accentColor: "bg-[#B80C09]",
    borderColor: "border-[#B80C09]",
    hoverColor: "hover:bg-[#B80C09]"
  },
  {
    id: "food-beverage",
    title: "Food & Beverage",
    subtitle: "Hygienic Processing Systems",
    description: "FDA-compliant sanitary fittings and tubing from brewery to bottling. Trusted by food processors for smooth, efficient production and minimal downtime.",
    growth: "Proven expertise",
    applications: ["Brewing systems", "Dairy processing", "Beverage production", "Food manufacturing"],
    image: "/images/industries/food-processing.jpg",
    imageAlt: "Food processing equipment and sanitary piping",
    bgColor: "bg-green-50",
    iconColor: "text-[#68A357]",
    accentColor: "bg-[#68A357]",
    borderColor: "border-[#68A357]",
    hoverColor: "hover:bg-[#68A357]"
  },
  {
    id: "marine-desalination",
    title: "Marine & Desalination",
    subtitle: "Corrosion-Resistant Systems",
    description: "Engineered for harsh marine environments and desalination plants. Corrosion-resistant stainless steel solutions for global water treatment infrastructure.",
    growth: "14.3% annual growth",
    applications: ["Desalination plants", "Offshore platforms", "Seawater systems", "Water treatment"],
    image: "/images/industries/marine-desalination.jpg",
    imageAlt: "Marine desalination plant and offshore equipment",
    bgColor: "bg-orange-50",
    iconColor: "text-[#FFA630]",
    accentColor: "bg-[#FFA630]",
    borderColor: "border-[#FFA630]",
    hoverColor: "hover:bg-[#FFA630]"
  }
]

export default function IndustriesSupport() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-1 bg-[#0f62fe]"></div>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Industries We Support
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Delivering precision-engineered stainless steel solutions across high-growth industries
          </p>
        </div>

        {/* Industries Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {industries.map((industry) => (
            <div key={industry.id} className={`${industry.bgColor} rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 ${industry.borderColor} border-2 border-opacity-10`}>
              {/* Image with Overlay Badge */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={industry.image}
                  alt={industry.imageAlt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='200' y='150' text-anchor='middle' dy='.3em' font-family='Arial' font-size='16' fill='%236b7280'%3E${industry.title}%3C/text%3E%3C/svg%3E`;
                  }}
                />
                {/* Growth Badge Overlay */}
                <div className="absolute top-4 right-4">
                  <span className={`${industry.accentColor} text-white text-sm font-semibold px-3 py-1 rounded-full shadow-lg`}>
                    {industry.growth}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {industry.title}
                </h3>
                
                <h4 className={`${industry.iconColor} text-lg font-semibold mb-4`}>
                  {industry.subtitle}
                </h4>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {industry.description}
                </p>

                {/* Applications */}
                <div className="mb-6">
                  <h5 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                    Key Applications
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {industry.applications.map((app) => (
                      <span key={app} className="bg-white text-gray-700 text-sm px-3 py-1 rounded-full shadow-sm">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Learn More Button */}
                <Link 
                  href={`/industries/${industry.id}`}
                  className={`inline-flex items-center justify-center w-full px-6 py-3 ${industry.accentColor} text-white font-semibold rounded-lg ${industry.hoverColor} hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md`}
                >
                  Learn More
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            Need solutions for a specialized application?
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-[#0f62fe] text-white font-semibold rounded-lg hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Discuss Your Project
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.955 8.955 0 01-2.293-.3c-.597.177-1.261.3-1.987.3-2.266 0-4.097-1.34-4.097-2.994 0-.695.337-1.336.901-1.845C5.087 14.49 5 13.755 5 13c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
