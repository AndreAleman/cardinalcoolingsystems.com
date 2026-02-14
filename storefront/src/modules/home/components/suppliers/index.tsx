// src/modules/home/components/suppliers/index.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function SanitubeSection() {
  return (
    <section className="py-24 px-6 border-b border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Image with Logo Overlay */}
          <div className="relative h-[400px] w-full border border-slate-200 bg-slate-100 rounded-sm overflow-hidden group shadow-sm">
            <Image
              src="/images/sanitube-team.png"
              alt="Sanitube Stainless Steel manufacturing facility and team"
              fill
              unoptimized
              className="object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority // Add if this is above the fold
            />
            
            {/* Logo Overlay */}
            <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm border border-slate-200 px-6 py-4 rounded-sm shadow-md">
              <div className="relative h-6 w-24">
                <Image
                  src="/images/sanitube_logo.svg"
                  alt="Sanitube Logo"
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              </div>
            </div>
          </div>

          {/* Content Side */}
          <div className="space-y-8 lg:pl-10">
            
            {/* Authorized Badge */}
            <div className="inline-flex items-center gap-2 text-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-semibold tracking-widest uppercase rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
              Authorized Distributor
            </div>
            
            {/* Heading & Description */}
            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl text-slate-900 font-medium tracking-tight">
                Proud Distributor of{' '}
                <span className="text-blue-600 block mt-1">Sanitube Stainless Steel</span>
              </h2>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                Sanitube is a leading American manufacturer of sanitary-grade stainless steel tubes, valves, and fittings based in Lakeland, Florida.
              </p>
              
              <p className="text-sm text-slate-500 leading-relaxed">
                Specializing in precision-engineered products meeting 3A specifications, serving pharmaceutical, beverage, dairy, HVAC, and industrial markets.
              </p>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link 
                href="/us/store"
                className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-3.5 text-xs uppercase tracking-widest font-semibold hover:bg-blue-600 transition-colors shadow-sm rounded-sm group"
              >
                View Sanitube Products
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
