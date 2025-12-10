"use client"

import Link from "next/link"
import Image from "next/image"
import { Link2, CornerDownRight, Settings2, ShieldCheck, Thermometer } from "lucide-react"

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
      <section className="py-24 px-6 border-b border-slate-200 bg-slate-50">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl text-slate-900 font-medium tracking-tight mb-2">
            Engineered Components
          </h2>
          <p className="text-slate-500 font-light">
            Featured products will appear here once configured.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 px-6 border-b border-slate-200 bg-slate-50" id="products">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl text-slate-900 font-medium tracking-tight mb-2">
              Engineered Components
            </h2>
            <p className="text-slate-500 font-light">
              Modular systems designed for rapid deployment and longevity.
            </p>
          </div>
          <a 
            href="/line-card.pdf" 
            download
            className="text-slate-600 text-sm border-b border-slate-300 pb-1 hover:text-blue-600 hover:border-blue-600 transition-colors inline-block"
          >
            Download Line Card
          </a>
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
                  className={`md:col-span-2 bg-white border border-slate-200 rounded-sm p-8 hover:shadow-lg transition-all duration-300 group flex flex-col ${
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
                      <h3 className="text-xl text-slate-900 font-semibold mb-2 tracking-tight">
                        {product.title}
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed font-light">
                        {product.subtitle}
                      </p>
                    </div>
                    
                    {/* Specs/Price */}
                    {product.price && (
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 text-slate-500 rounded">
                          {typeof product.price === 'number' 
                            ? `PRICE: $${product.price.toFixed(2)}` 
                            : product.price}
                        </span>
                      </div>
                    )}
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
                className="bg-white border border-slate-200 rounded-sm hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col"
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
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg text-slate-900 font-medium tracking-tight">
                      {product.title}
                    </h3>
                    <Icon className="w-5 h-5 text-slate-400 flex-shrink-0 ml-2" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed font-light">
                    {product.subtitle}
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
