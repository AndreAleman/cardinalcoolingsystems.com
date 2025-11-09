// src/modules/home/components/suppliers/index.tsx
'use client';

import Image from 'next/image';

export default function SanitubeSection() {
  return (
    <section className="w-full bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 border-y border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Image with Logo Overlay */}
          <div className="relative h-64 lg:h-80 w-full rounded-lg overflow-hidden shadow-lg order-2 lg:order-1">
            <Image
              src="/images/sanitube-team.jpg"
              alt="Sanitube Stainless Steel - Authorized Distributor"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Logo overlay on image - moved closer to corner */}
            <div className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-md shadow-lg">
              <div className="relative h-12 w-32">
                <Image
                  src="/images/sanitube_logo.svg"
                  alt="Sanitube Logo"
                  fill
                  className="object-contain"
                  sizes="128px"
                />
              </div>
            </div>
          </div>

          {/* Text Content */}
          <div className="space-y-4 order-1 lg:order-2">
            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
              Authorized Distributor
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900">
              Proud Distributor of{' '}
              <span className="text-blue-600">Sanitube Stainless Steel</span>
            </h2>
            
            <p className="text-gray-700 leading-relaxed">
              Sanitube is a leading American manufacturer of sanitary-grade stainless steel tubes, valves, and fittings based in Lakeland, Florida. Specializing in precision-engineered products meeting 3A specifications, Sanitube serves pharmaceutical, beverage, dairy, HVAC, and industrial markets.
            </p>

            <div className="pt-2">
              <a
                href="/store"
                className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                View Sanitube Products
                <svg
                  className="ml-2 -mr-1 w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
