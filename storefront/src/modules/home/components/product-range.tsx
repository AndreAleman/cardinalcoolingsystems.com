"use client"

import Link from "next/link"
import Image from "next/image"
import { Link2, CornerDownRight, Settings2, ShieldCheck, Thermometer, Download } from "lucide-react"

type Product = {
  id: string
  title: string
  subtitle: string
  image: string
  handle: string
  price?: string | number
}

type Props = {
  products: Product[]
}

export default function ProductRange({ products }: Props) {
  // Layout configuration based on position (repeats every 5 products)
  const layoutPattern = [
    { type: "large", icon: Link2, color: "blue", position: "left" },
    { type: "regular", icon: CornerDownRight, color: "blue" },
    { type: "regular", icon: Settings2, color: "blue" },
    { type: "regular", icon: ShieldCheck, color: "blue" },
    { type: "large", icon: Thermometer, color: "orange", position: "right" },
  ]

  const getProductLayout = (index: number) => {
    return layoutPattern[index % layoutPattern.length]
  }

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
      }
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  if (!products || products.length === 0) {
    return (
      <section className="py-24 px-6 border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl text-slate-900 font-medium tracking-tight mb-2">
            Featured Products
          </h2>
          <p className="text-slate-500 font-light">
            Products will appear here once configured.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 px-6 border-b border-slate-200 bg-white" id="products">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl text-slate-900 font-semibold tracking-tight mb-2">
              Featured Products
            </h2>
            <p className="text-slate-600 text-base">
              Featured sanitary fittings and valves for data centers and process lines. In stock and ready to ship
            </p>
          </div>



        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product, index) => {
            const layout = getProductLayout(index)
            const Icon = layout.icon
            const colorClasses = getColorClasses(layout.color)
            const isLarge = layout.type === "large"

            // Large featured card (2 columns)
            if (isLarge) {
              const isReversed = layout.position === "right"
              
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.handle}`}
                  className={`md:col-span-2 bg-white border-2 border-slate-200 rounded-sm p-8 hover:shadow-xl hover:border-blue-300 transition-all duration-300 group flex flex-col ${
                    isReversed ? 'md:flex-row-reverse' : 'md:flex-row'
                  } gap-8 items-center overflow-hidden`}
                >
                  <div className="flex-1 space-y-6 relative z-10">
                    {/* Icon Badge */}
                    <div className={`h-10 w-10 ${colorClasses.bg} ${colorClasses.border} border flex items-center justify-center ${colorClasses.text} rounded-sm transition-colors`}>
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    </div>
                    
                    {/* Content */}
                    <div>
                      <h3 className="text-2xl text-slate-900 font-semibold mb-2 tracking-tight">
                        {product.title}
                      </h3>
                      <p className="text-base text-slate-600 leading-relaxed">
                        {product.subtitle}
                      </p>
                    </div>
                    
                    {/* Price */}
{product.price && (
  <div className="flex items-center gap-3">
    <span className="text-2xl font-bold text-slate-900">
      {typeof product.price === 'number' 
        ? `From $${product.price.toFixed(2)}`
        : product.price}
    </span>
    <span className="text-xs text-slate-500 uppercase tracking-wide">
      In Stock
    </span>
  </div>
)}


                    {/* View Product Link */}
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 group-hover:gap-3 transition-all">
                      View Details
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Image Container */}
                  <div className="w-full md:w-1/2 aspect-square md:aspect-auto md:h-80 bg-slate-100 relative rounded-sm overflow-hidden">
                    {product.image && (
                      <>
                        <Image
                          src={product.image}
                          alt={product.title}
                          fill
                          className="object-cover transition-all duration-500 grayscale-[20%] opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent mix-blend-overlay"></div>
                      </>
                    )}
                  </div>
                </Link>
              )
            }

            // Regular card (1 column)
            return (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="bg-white border-2 border-slate-200 rounded-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 group overflow-hidden flex flex-col"
              >
                {/* Image Top */}
                <div className="h-48 bg-slate-100 relative overflow-hidden">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={product.title}
                      fill
                      className="object-cover transition-all duration-500 grayscale-[20%] opacity-80 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
                    />
                  )}
                </div>
                
                {/* Content */}
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg text-slate-900 font-semibold tracking-tight flex-1">
                      {product.title}
                    </h3>
                    <Icon className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2 group-hover:text-blue-600 transition-colors" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-grow">
                    {product.subtitle}
                  </p>
                  
                  {/* Price & CTA */}
{product.price ? (
  <div className="flex items-center justify-between mt-auto">
    <span className="text-xl font-bold text-slate-900">
      {typeof product.price === 'number' 
        ? `From $${product.price.toFixed(2)}`
        : product.price}
    </span>
    <span className="text-sm text-blue-600 font-semibold group-hover:underline">
      View →
    </span>
  </div>
) : (
  <span className="text-sm text-blue-600 font-semibold group-hover:underline mt-auto">
    View Details →
  </span>
)}

                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
