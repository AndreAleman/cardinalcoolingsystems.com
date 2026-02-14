// src/modules/home/components/hero-stagger.tsx
"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

interface BlogPost {
  _id: string
  title: string
  slug: {
    current: string
  }
  excerpt?: string
  mainImage?: {
    asset?: {
      url: string
    }
    alt?: string
  }
}

interface HeroProps {
  recentPosts: BlogPost[]
  countryCode: string
}

export default function Hero({ recentPosts, countryCode }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Build slides from 3 most recent blog posts
  const slides = recentPosts.length >= 3 
    ? recentPosts.slice(0, 3).map(post => ({
        image: post.mainImage?.asset?.url || "/images/hero/home_page1.jpg",
        alt: post.mainImage?.alt || post.title,
        title: post.title,
        description: post.excerpt || "Read our latest insights and technical articles",
        link: `/${countryCode}/blog/${post.slug.current}`,
        caption: "BLOG POST"
      }))
    : [
        {
          image: "/images/hero/home_page1.jpg",
          alt: "Industrial manufacturing equipment",
          title: "Featured Product",
          description: "High-quality sanitary fittings for your production line",
          link: "/store/products/featured-product-handle",
          caption: "FEATURED"
        },
        {
          image: "/images/hero/home_page2.jpg",
          alt: "Precision sanitary fittings",
          title: "Latest Insights",
          description: "Industry news and technical articles",
          link: "/blog/latest-post-slug",
          caption: "BLOG POST"
        },
        {
          image: "/images/hero/home_page3.jpg",
          alt: "Stainless steel components",
          title: "Premium Components",
          description: "Browse our full catalog of products",
          link: "/store",
          caption: "CATALOG"
        }
      ]

  const totalSlides = slides.length

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
        backgroundImage: 'linear-gradient(to right, rgba(0, 0, 0, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px)'
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          
          {/* ───────────── Left Content (Text) */}
          <div className="lg:col-span-7 space-y-8 relative z-10">
            
            {/* Status Badge - URGENCY */}
            <div className="inline-flex items-center gap-3 text-orange-600 border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-medium tracking-widest uppercase rounded-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
              </span>
              In Stock • Ships Next Day
            </div>
            
            {/* Main Heading - BENEFIT-FOCUSED */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-medium text-slate-900 tracking-tight leading-[1.05]">
              Leak-Free Sanitary<br />
              <span className="text-slate-600">Fittings & Valves.</span>
            </h1>

            {/* Subheading - CLEARER, MORE SPECIFIC */}
{/* Subheading - DARKER TEXT */}
<p className="text-lg text-slate-700 max-w-xl font-normal leading-relaxed">
  304/316 stainless steel fittings for data centers and food processing. 3A certified with zero-leak guarantee.
</p>

            
            {/* CTA Buttons - CLEAR HIERARCHY */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="/contact"
                className="flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 text-sm font-bold tracking-wide hover:bg-blue-700 transition-colors shadow-lg rounded-sm"
              >
                Get Quote in 24 Hours
              </a>
              <a
                href="/store"
                className="flex items-center justify-center gap-3 bg-white border-2 border-blue-600 text-blue-600 px-8 py-4 text-sm font-bold tracking-wide hover:bg-blue-50 transition-colors rounded-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
                </svg>
                Shop Products
              </a>
            </div>

            {/* Trust Signals - STRONGER */}
            <div className="flex flex-wrap items-center gap-6 pt-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-900">3A Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-900">Used by 12+ Facilities</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-slate-900">Zero-Leak Guarantee</span>
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
                  <img
                    src={slide.image}
                    alt={slide.alt}
                    className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                  
                  {/* Slide Text */}
                  <div className="absolute bottom-6 left-6 z-10 max-w-xs">
                    <h3 className="text-xl text-white font-medium tracking-tight mb-1 shadow-sm">
                      {slide.title}
                    </h3>
                    <p className="text-xs text-slate-300 font-light leading-relaxed line-clamp-2">
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
