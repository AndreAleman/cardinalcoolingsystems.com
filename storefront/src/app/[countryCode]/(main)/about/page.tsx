import { Metadata } from "next"
import Link from "next/link"

interface Props {
  params: { countryCode: string }
}

export const metadata: Metadata = {
  title: "About Us - Our Story & Mission",
  description: "Learn about Cowbird Depot's commitment to providing premium sanitary stainless steel fittings for food processing, pharmaceuticals, and industrial applications.",
}

export default function AboutPage({ params }: Props) {
  const { countryCode } = params

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gray-50 pt-32 pb-16">
        <div className="content-container">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8">
            <Link href={`/${countryCode}`} className="hover:text-blue-600">
              Home
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">About Us</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Content */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Premium Quality, Trusted Reliability
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                For over two decades, we've been the trusted partner for businesses requiring 
                the highest quality sanitary stainless steel fittings and components.
              </p>
            </div>

            {/* Hero Image */}
            <div className="relative">
              <img
                src="/images/about/about-main.jpg"
                alt="About Cowbird Depot - Sanitary fittings expertise"
                className="w-full h-[400px] object-cover rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20">
        <div className="content-container">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Our Story
            </h2>
            
            <div className="prose prose-lg max-w-none text-gray-700">
              <p className="text-lg mb-6">
                Founded with a mission to provide superior sanitary stainless steel solutions, 
                Cowbird Depot has grown from a small specialty supplier to a trusted partner 
                for industries where precision and cleanliness are paramount.
              </p>
              
              <p className="mb-6">
                Our journey began when we recognized the need for reliable, high-quality 
                sanitary fittings that could meet the demanding standards of food processing, 
                pharmaceutical manufacturing, and biotechnology applications. Today, we serve 
                clients across diverse industries with the same commitment to excellence.
              </p>

              <p className="mb-6">
                Every product we supply undergoes rigorous quality control to ensure it meets 
                or exceeds industry standards. We understand that in your industry, there's 
                no room for compromise when it comes to sanitation, durability, and performance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="bg-gray-50 py-20">
        <div className="content-container">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Our Values
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Quality */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Quality First</h3>
              <p className="text-gray-600">
                Every product meets the highest industry standards for sanitary applications. 
                We never compromise on quality or safety.
              </p>
            </div>

            {/* Expertise */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 11.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Technical Expertise</h3>
              <p className="text-gray-600">
                Deep knowledge of sanitary fitting applications across food processing, 
                pharmaceuticals, and industrial environments.
              </p>
            </div>

            {/* Service */}
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Customer Service</h3>
              <p className="text-gray-600">
                Responsive support and technical guidance to help you find the right 
                solution for your specific application needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20">
        <div className="content-container">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Industries We Serve
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Food Processing */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Food Processing</h3>
              <p className="text-gray-600 text-sm">
                Sanitary fittings for dairy, beverage, and food production facilities.
              </p>
            </div>

            {/* Pharmaceuticals */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 11.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pharmaceuticals</h3>
              <p className="text-gray-600 text-sm">
                High-purity components for pharmaceutical and biotech manufacturing.
              </p>
            </div>

            {/* Brewing */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h1a1 1 0 011 1v2a1 1 0 01-1 1h-1m-10-4h1a1 1 0 011 1v2a1 1 0 01-1 1H7m0 0H4a2 2 0 01-2-2v-6a2 2 0 012-2h12a2 2 0 012 2v6a2 2 0 01-2 2h-3M7 16v4a2 2 0 002 2h6a2 2 0 002-2v-4M7 16H4a2 2 0 01-2-2v-2a2 2 0 012-2h3v4z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Brewing & Beverage</h3>
              <p className="text-gray-600 text-sm">
                Specialized fittings for breweries and beverage production lines.
              </p>
            </div>

            {/* Industrial */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Industrial</h3>
              <p className="text-gray-600 text-sm">
                Heavy-duty components for chemical processing and manufacturing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section with Background Image */}
      <section className="relative bg-blue-600 text-white py-16 overflow-hidden">
        {/* Background Image Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/images/about/cta-background.jpg")',
          }}
        ></div>
        
        {/* Content */}
        <div className="content-container text-center relative z-10">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Work with Us?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get in touch to discuss your sanitary fitting requirements. 
            Our technical experts are ready to help you find the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={`/${countryCode}/contact`}
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded hover:bg-gray-100 transition-colors"
            >
              Contact Us
            </Link>
            <Link 
              href={`/${countryCode}/categories`}
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded hover:bg-white hover:text-blue-600 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
