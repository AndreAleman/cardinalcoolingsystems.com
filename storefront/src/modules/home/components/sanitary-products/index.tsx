// src/modules/home/components/sanitary-products.tsx
"use client"

import { Factory, Server, Wheat, Check } from "lucide-react"

type ProductItem = {
  id: string
  title: string
  description: string
  features: string[]
  icon: "factory" | "server" | "wheat"
  colorScheme: "teal" | "red" | "orange"
  sectorNumber: string
  ctaText: string
  ctaLink: string
}

type Props = {
  products?: ProductItem[]
}

export default function SanitaryProducts({ products }: Props) {
  // Default product data - REORDERED: Data Centers first
  const defaultProducts: ProductItem[] = [
    {
      id: "data-centers",
      title: "Data Centers",
      description: "Precision liquid cooling for high-density compute. Zero-leak fittings engineered for 99.99% uptime in mission-critical environments.",
      features: [
        "Zero-leak quick disconnects",
        "316L stainless steel construction",
        "Pressure rated to 300 PSI"
      ],
      icon: "server",
      colorScheme: "red",
      sectorNumber: "01",
      ctaText: "View Cooling Products",
      ctaLink: "/store?category=data-center"
    },
    {
      id: "food-processing",
      title: "Food & Beverage",
      description: "3A certified sanitary fittings meeting FDA and EHEDG standards. Electropolished surfaces designed for CIP/SIP cycles.",
      features: [
        "3A sanitary standard certified",
        "Electropolished to 15 Ra or better",
        "Tri-clamp & SMS connections"
      ],
      icon: "wheat",
      colorScheme: "orange",
      sectorNumber: "02",
      ctaText: "View Sanitary Fittings",
      ctaLink: "/store?category=food-processing"
    },
    {
      id: "industrial",
      title: "Industrial & OEM",
      description: "Heavy-duty stainless fittings for hydraulics, pneumatics, and process systems. Built for extreme temperatures and pressures.",
      features: [
        "High-pressure rated",
        "Corrosion resistant 316 SS",
        "Custom configurations available"
      ],
      icon: "factory",
      colorScheme: "teal",
      sectorNumber: "03",
      ctaText: "View Industrial Products",
      ctaLink: "/store?category=industrial"
    }
  ]

  const displayProducts = products || defaultProducts

  const getColorClasses = (scheme: "teal" | "red" | "orange") => {
    switch (scheme) {
      case "teal":
        return {
          badge: "text-teal-600 border-teal-200 bg-teal-50",
          icon: "text-teal-500",
          checkmark: "text-teal-600",
          button: "text-teal-700 hover:text-teal-800 hover:bg-teal-50"
        }
      case "red":
        return {
          badge: "text-red-600 border-red-200 bg-red-50",
          icon: "text-red-600",
          checkmark: "text-red-600",
          button: "text-red-700 hover:text-red-800 hover:bg-red-50"
        }
      case "orange":
        return {
          badge: "text-orange-600 border-orange-200 bg-orange-50",
          icon: "text-orange-500",
          checkmark: "text-orange-600",
          button: "text-orange-700 hover:text-orange-800 hover:bg-orange-50"
        }
    }
  }

  const renderIcon = (iconName: "factory" | "server" | "wheat") => {
    const IconComponent = iconName === "factory" ? Factory : iconName === "server" ? Server : Wheat
    return <IconComponent className="w-10 h-10" strokeWidth={1.5} />
  }

  return (
    <section id="products" className="border-b border-slate-300 bg-blue-50">

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {displayProducts.map((product, index) => {
          const colors = getColorClasses(product.colorScheme)
          const isLast = index === displayProducts.length - 1

          return (
            <div
              key={product.id}
              className={`relative group border-b lg:border-b-0 ${
                !isLast ? "lg:border-r" : ""
              } border-slate-300 p-10 hover:bg-slate-50 transition-all duration-300`}
            >
              {/* Icon - Top Right */}
              <div className={`absolute top-10 right-10 transition-colors ${colors.icon}`}>
                {renderIcon(product.icon)}
              </div>

              <div className="h-full flex flex-col justify-between space-y-8">
                <div>
                  {/* Sector Badge */}
                  <h3 className={`text-xs font-mono mb-4 uppercase tracking-widest border inline-block px-2 py-1 rounded-sm ${colors.badge}`}>
                    Sector {product.sectorNumber}
                  </h3>

                  {/* Title */}
                  <h2 className="text-2xl lg:text-3xl text-slate-900 font-semibold tracking-tight mb-4">
                    {product.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="space-y-4">
                  <ul className="space-y-3">
                    {product.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                        <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.checkmark}`} strokeWidth={2.5} />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Link */}
                  <a
                    href={product.ctaLink}
                    className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors pt-2 ${colors.button}`}
                  >
                    {product.ctaText}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
