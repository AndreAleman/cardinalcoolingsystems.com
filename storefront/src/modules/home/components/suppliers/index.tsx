// src/modules/home/components/suppliers/index.tsx
'use client';

import Image from 'next/image';

export default function SanitubeSection() {
  return (
    <section className="w-full bg-gray-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-6">
            <h2 className="text-4xl font-bold text-gray-900 sm:text-5xl">
              Proud Distributor of{' '}
              <span className="text-blue-600">Sanitube Stainless Steel</span>
            </h2>
            
            <div className="space-y-4 text-gray-700 text-lg leading-relaxed">
              <p>
                Sanitube is a leading American manufacturer of sanitary-grade stainless steel tubes, valves, and fittings based in Lakeland, Florida. Founded in 2010, this family-owned business operates over 100,000 square feet of production and warehousing space.
              </p>

              <p>
                Specializing in precision-engineered products meeting 3A specifications, Sanitube serves data centers, dairy, HVAC, beverage, pharmaceutical, and industrial markets with superior quality and industry-leading lead times.
              </p>
            </div>

            <div className="pt-4">
              <a
                href="/store"
                className="inline-flex items-center px-6 py-3 text-base font-medium text-white bg-blue-600 rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                View Sanitube Products
                <svg
                  className="ml-2 -mr-1 w-5 h-5"
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

          {/* Image/Photo Placeholder */}
          <div className="relative h-[500px] w-full rounded-lg overflow-hidden shadow-xl">
            <Image
              src="/images/sanitube-team.jpg"
              alt="Sanitube team and facilities"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
            />
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-lg">
              <p className="text-sm font-semibold text-gray-900">
                Family-Owned Since 2010
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
