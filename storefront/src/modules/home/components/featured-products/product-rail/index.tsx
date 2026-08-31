// src/modules/home/components/featured-products/product-rail/index.tsx
"use client"

import { HttpTypes } from "@medusajs/types"
import { Link2, CornerDownRight, Settings2, ShieldCheck, Thermometer } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const { products } = collection

  if (!products || products.length === 0) {
    return null
  }

  // Default layout configuration based on product position
  const defaultLayouts = [
    { layout: "large", icon: "link", color: "blue" },        // 1st product
    { layout: "regular", icon: "corner-down-right", color: "blue" }, // 2nd product
    { layout: "regular", icon: "settings-2", color: "blue" },        // 3rd product
    { layout: "regular", icon: "shield-check", color: "blue" },      // 4th product
    { layout: "large", icon: "thermometer", color: "orange" },       // 5th product
  ]

  // Map icon names to components
  const iconMap: { [key: string]: any } = {
    "link": Link2,
    "corner-down-right": CornerDownRight,
    "settings-2": Settings2,
    "shield-check": ShieldCheck,
    "thermometer": Thermometer,
  }

  const getIcon = (iconName: string) => {
    return iconMap[iconName] || Link2
  }

  const getProductConfig = (product: any, index: number) => {
    // @ts-ignore
    const metadata = product.metadata || {}
    
    // Use default layout for this position, or override from metadata
    const defaultConfig = defaultLayouts[index % defaultLayouts.length] || defaultLayouts[0]
    
    return {
      layout: metadata.featured_layout || defaultConfig.layout,
      iconName: metadata.icon || defaultConfig.icon,
      color: metadata.accent_color || defaultConfig.color,
      specs: metadata.specs || []
    }
  }

  return (
    <section className="py-24 px-6 border-b border-slate-200 bg-slate-50" id="featured-products">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl text-slate-900 font-medium tracking-tight mb-2">
              {collection.title || "Engineered Components"}
            </h2>
            <p className="text-slate-500 font-light">
              Modular systems designed for rapid deployment and longevity.
            </p>
          </div>
          <a 
            href="/line-card.pdf" 
            download
            className="text-slate-600 text-sm border-b border-slate-300 pb-1 hover:text-blue-600 hover:border-blue-600 transition-colors"
          >
            Download Line Card
          </a>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product, index) => {
            const config = getProductConfig(product, index)
            const Icon = getIcon(config.iconName)
            const isLarge = config.layout === "large"

            // Color class helpers (need to be explicit for Tailwind)
            const getColorClasses = (color: string) => {
              const colors = {
                blue: {
                  bg: "bg-blue-50",
                  border: "border-blue-100",
                  text: "text-blue-600"
                },
                orange: {
                  bg: "bg-orange-50",
                  border: "border-orange-100",
                  text: "text-orange-600"
                },
                indigo: {
                  bg: "bg-indigo-50",
                  border: "border-indigo-100",
                  text: "text-indigo-600"
                }
              }
              return colors[color as keyof typeof colors] || colors.blue
            }

            const colorClasses = getColorClasses(config.color)

            // Large featured card (spans 2 columns)
            if (isLarge) {
              return (
                <Link
                  key={product.id}
                  href={`/us/products/${product.handle}`}
                  className="md:col-span-2 bg-white border border-slate-200 p-8 hover:shadow-lg transition-all duration-300 group flex flex-col md:flex-row gap-8 items-center overflow-hidden"
                >
                  <div className="flex-1 space-y-6 relative z-10">
                    <div className={`h-10 w-10 ${colorClasses.bg} ${colorClasses.border} border flex items-center justify-center ${colorClasses.text} rounded-sm`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl text-slate-900 font-semibold mb-2">
                        {product.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                    {config.specs.length > 0 && (
                      <div className="flex gap-2 flex-wrap">
                        {config.specs.map((spec: string, idx: number) => (
                          <span key={idx} className="text-[10px] font-mono bg-slate-100 px-2 py-1 text-slate-500 rounded">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="w-full md:w-1/2 aspect-square md:aspect-auto h-full bg-slate-100 relative rounded-sm overflow-hidden">
                    {product.thumbnail && (
                      <Image
                        src={product.thumbnail}
                        alt={product.title || "Product"}
                        fill
                        className="object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent mix-blend-overlay"></div>
                  </div>
                </Link>
              )
            }

            // Regular card (single column)
            return (
              <Link
                key={product.id}
                href={`/us/products/${product.handle}`}
                className="bg-white border border-slate-200 hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col"
              >
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {product.thumbnail && (
                    <Image
                      src={product.thumbnail}
                      alt={product.title || "Product"}
                      fill
                      className="object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                    />
                  )}
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-slate-900 font-medium">
                      {product.title}
                    </h3>
                    <Icon className="w-5 h-5 text-slate-400" />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
