// src/modules/home/components/sanitary-products.tsx
"use client"

import { Factory, Server, Wheat, Check } from "lucide-react"

type ProductItem = {
  id: string
  title: string
  description: string
  features: string[]
  icon: "factory" | "server" | "wheat"
  colorScheme: "indigo" | "blue" | "orange"
  sectorNumber: string
}

type Props = {
  products?: ProductItem[]
}

export default function SanitaryProducts({ products }: Props) {
  // Default product data with reference text
  const defaultProducts: ProductItem[] = [
    {
      id: "industrial",
      title: "Industrial & Mfg",
      description: "High-tolerance hydraulic components for automation robotics and heavy machinery. Built to withstand extreme vibration.",
      features: [
        "SAE standard flanges",
        "Fatigue-rated alloys"
      ],
      icon: "factory",
      colorScheme: "indigo",
      sectorNumber: "01"
    },
    {
      id: "data-centers",
      title: "Data Centers",
      description: "Liquid cooling infrastructure for high-density compute. Leak-proof reliability ensuring 99.999% uptime for hyperscalers.",
      features: [
        "Zero-leak quick disconnects",
        "Non-drip coupling systems"
      ],
      icon: "server",
      colorScheme: "blue",
      sectorNumber: "02"
    },
    {
      id: "food-processing",
      title: "Food Processing",
      description: "Sanitary grade fittings meeting strict FDA & EHEDG standards. Designed for frequent washdowns and sterilization cycles.",
      features: [
        "Electropolished surfaces",
        "Tri-clamp connections"
      ],
      icon: "wheat",
      colorScheme: "orange",
      sectorNumber: "03"
    }
  ]

  const displayProducts = products || defaultProducts

  const getColorClasses = (scheme: "indigo" | "blue" | "orange") => {
    switch (scheme) {
      case "indigo":
        return {
          badge: "text-indigo-600 border-indigo-100 bg-indigo-50",
          icon: "text-slate-200 group-hover:text-indigo-100",
          checkmark: "text-indigo-600"
        }
      case "blue":
        return {
          badge: "text-blue-600 border-blue-100 bg-blue-50",
          icon: "text-slate-200 group-hover:text-blue-100",
          checkmark: "text-blue-600"
        }
      case "orange":
        return {
          badge: "text-orange-600 border-orange-200 bg-orange-50",
          icon: "text-slate-200 group-hover:text-orange-100",
          checkmark: "text-orange-600"
        }
    }
  }

  const renderIcon = (iconName: "factory" | "server" | "wheat") => {
    const IconComponent = iconName === "factory" ? Factory : iconName === "server" ? Server : Wheat
    return <IconComponent className="w-10 h-10" strokeWidth={1.5} />
  }

  return (
    <section id="products" className="border-b border-slate-200 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {displayProducts.map((product, index) => {
          const colors = getColorClasses(product.colorScheme)
          const isLast = index === displayProducts.length - 1

          return (
            <div
              key={product.id}
              className={`relative group border-b lg:border-b-0 ${
                !isLast ? "lg:border-r" : ""
              } border-slate-200 p-10 hover:bg-slate-50 transition-colors duration-500`}
            >
              {/* Icon - Top Right */}
              <div className={`absolute top-10 right-10 transition-colors ${colors.icon}`}>
                {renderIcon(product.icon)}
              </div>

              <div className="h-full flex flex-col justify-between space-y-10">
                <div>
                  {/* Sector Badge */}
                  <h3 className={`text-xs font-mono mb-4 uppercase tracking-widest border inline-block px-2 py-1 ${colors.badge}`}>
                    Sector {product.sectorNumber}
                  </h3>

                  {/* Title */}
                  <h2 className="text-2xl lg:text-3xl text-slate-900 font-medium tracking-tight mb-4">
                    {product.title}
                  </h2>

                  {/* Description */}
                  <p className="text-sm text-slate-500 leading-relaxed font-light">
                    {product.description}
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs md:text-sm text-slate-600">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colors.checkmark}`} strokeWidth={2} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
