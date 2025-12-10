// src/modules/home/components/hero-stagger.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 4

  // Slide data with your image paths and link destinations
  const slides = [
    {
      image: "/images/hero/home_page1.jpg",
      alt: "Industrial manufacturing equipment",
      title: "Featured Product",
      description: "High-quality sanitary fittings for your production line",
      link: "/store/products/featured-product-handle", // Update with actual product handle
      caption: "FEATURED"
    },
    {
      image: "/images/hero/home_page2.jpg",
      alt: "Precision sanitary fittings",
      title: "Latest Insights",
      description: "Industry news and technical articles",
      link: "/blog/latest-post-slug", // Update with actual blog slug
      caption: "BLOG POST"
    },
    {
      image: "/images/hero/home_page3.jpg",
      alt: "Stainless steel components",
      title: "Premium Components",
      description: "Browse our full catalog of products",
      link: "/store", // Or another product
      caption: "CATALOG"
    },
    {
      image: "/images/hero/home_page4.jpg",
      alt: "Contact our team",
      title: "Get in Touch",
      description: "Discuss your project requirements",
      link: "/contact",
      caption: "CONTACT"
    }
  ]

  // Auto-advance slider every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [totalSlides])

  const moveSlide = (direction: number) => {
    setCurrentSlide((prev) => {
      const next = prev + direction
      if (next < 0) return totalSlides - 1
      if (next >= totalSlides) return 0
      return next
    })
  }

  const progressWidth = ((currentSlide + 1) / totalSlides) * 100

  return (
    <section 
      className="bg-white pt-20 pb-8 lg:pt-32 md:pb-12 border-b border-slate-200 overflow-hidden"
      style={{
        backgroundSize: '40px 40px',
        backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px)'
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          
          {/* ───────────── Left Content (Text) */}
          <div className="lg:col-span-7 space-y-8 relative z-10">
            
            {/* Status Badge */}
            <div className="inline-flex items-center gap-3 text-orange-600 border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-medium tracking-widest uppercase rounded-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              Production Line Active
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-medium text-slate-900 tracking-tight leading-[1.05]">
              High-Quality<br />
              <span className="text-slate-400">Sanitary Parts.</span>
            </h1>
            
            {/* Subheading */}
            <p className="text-lg text-slate-500 max-w-xl font-light leading-relaxed">
              From large-scale food production to small-batch brewing, our
              stainless-steel fittings deliver reliability, hygiene, and
              performance you can trust.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="/store"
                className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-3.5 text-xs uppercase tracking-widest font-semibold hover:bg-blue-600 transition-colors shadow-sm"
              >
                Browse Products
              </a>
              <a
                href="/contact"
                className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 px-8 py-3.5 text-xs uppercase tracking-widest font-semibold hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                Contact Us
              </a>
            </div>

            {/* Certification Badges */}
            <div className="flex items-center gap-6 pt-6 text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                3A Sanitary Standard Certified
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Liquid Cooling Preferred
              </div>
            </div>
          </div>

          {/* ───────────── Right Content: Technical Gallery Slider */}
          <div className="lg:col-span-5 relative h-[450px] w-full border border-slate-200 bg-slate-100 rounded-sm overflow-hidden group select-none shadow-sm">
            
            {/* Status Overlay (Top Left) */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <div className="text-[10px] text-blue-600 font-mono bg-white/90 backdrop-blur px-2 py-1 border border-blue-100 rounded-sm shadow-sm">
                {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
              </div>
              <div className="text-[10px] text-slate-500 font-mono bg-white/90 backdrop-blur px-2 py-1 border border-slate-200 rounded-sm shadow-sm">
                {slides[currentSlide].caption}
              </div>
            </div>

            {/* Slider Track */}
            <div 
              className="flex h-full transition-transform duration-700 ease-[cubic-bezier(0.25,1,0.5,1)]"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {slides.map((slide, index) => (
                <Link
                  key={index}
                  href={slide.link}
                  className="min-w-full h-full relative block"
                >
                  <Image
                    src={slide.image}
                    alt={slide.alt}
                    fill
                    className="object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                    priority={index === 0}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                  
                  {/* Slide Text */}
                  <div className="absolute bottom-6 left-6 z-10 max-w-xs">
                    <h3 className="text-xl text-white font-medium tracking-tight mb-1 shadow-sm">
                      {slide.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-light leading-relaxed">
                      {slide.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Navigation Controls (Bottom Right) */}
            <div className="absolute bottom-4 right-4 z-20 flex gap-1">
              <button
                onClick={() => moveSlide(-1)}
                className="w-10 h-10 bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all rounded-sm shadow-sm"
                aria-label="Previous slide"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => moveSlide(1)}
                className="w-10 h-10 bg-white/90 backdrop-blur border border-slate-200 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all rounded-sm shadow-sm"
                aria-label="Next slide"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-white/20 z-20">
              <div 
                className="h-full bg-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${progressWidth}%` }}
              ></div>
            </div>

            {/* Decorative overlay corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-white/50 z-10 m-2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-white/50 z-10 m-2 pointer-events-none"></div>
          </div>
        </div>
      </div>
    </section>
  )
}
