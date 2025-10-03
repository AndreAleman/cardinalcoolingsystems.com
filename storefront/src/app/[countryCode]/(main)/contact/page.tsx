import { Metadata } from "next"
import Link from "next/link"

interface Props {
  params: { countryCode: string }
}

export const metadata: Metadata = {
  title: "Contact Us - Get Expert Guidance",
  description: "Contact Cowbird Depot for expert guidance on sanitary stainless steel fittings. Our technical team is ready to help with your specific application needs.",
}

export default function ContactPage({ params }: Props) {
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
            <span className="text-gray-900 font-medium">Contact Us</span>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Get Expert Guidance
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Our technical experts are here to help you find the perfect sanitary fitting 
              solution for your specific application. Contact us today.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section - Form Left, Info Right */}
      <section className="py-20 bg-white">
        <div className="content-container">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left Side - Contact Form */}
            <div className="bg-gray-50 rounded-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Send Us a Message
              </h2>

              <form className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name*
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name*
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address*
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number*
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    className="block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message*
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded resize-none"
                    placeholder="Tell us about your project or requirements..."
                  />
                </div>

                {/* Terms Checkbox */}
                <div className="flex items-center">
                  <input
                    id="agreeToTerms"
                    name="agreeToTerms"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded flex-shrink-0"
                  />
                  <label htmlFor="agreeToTerms" className="ml-3 block text-sm text-gray-700">
                    I agree to the Terms & Conditions
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors duration-200 rounded"
                >
                  Send Message
                  <svg 
                    className="ml-2 w-4 h-4" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17 8l4 4m0 0l-4 4m4-4H3" 
                    />
                  </svg>
                </button>
              </form>
            </div>

            {/* Right Side - Contact Information (Centered) */}
            <div className="flex items-center justify-center">
              <div className="max-w-md">
                <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                  Get in Touch
                </h2>
                
                <div className="space-y-8">
                  {/* Phone */}
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Call Us</h3>
                      <p className="text-gray-600 mb-2">
                        Speak directly with our technical experts
                      </p>
                      <a 
                        href="tel:+1234567890" 
                        className="text-blue-600 font-semibold hover:text-blue-700 transition-colors text-lg"
                      >
                        (123) 456-7890
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        Mon-Fri 8:00 AM - 6:00 PM EST
                      </p>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Email Us</h3>
                      <p className="text-gray-600 mb-2">
                        Send us your technical questions
                      </p>
                      <a 
                        href="mailto:info@cowbirddepot.com" 
                        className="text-blue-600 font-semibold hover:text-blue-700 transition-colors text-lg"
                      >
                        info@cowbirddepot.com
                      </a>
                      <p className="text-sm text-gray-500 mt-1">
                        We respond within 24 hours
                      </p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">Visit Us</h3>
                      <p className="text-gray-600 mb-2">
                        Our headquarters and warehouse
                      </p>
                      <address className="text-gray-900 not-italic leading-relaxed">
                        123 Industrial Boulevard<br />
                        Manufacturing District<br />
                        Chicago, IL 60601
                      </address>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50">
        <div className="content-container">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What industries do you serve?
              </h3>
              <p className="text-gray-600">
                We serve food processing, pharmaceuticals, brewing & beverage, biotechnology, 
                and general industrial applications requiring sanitary stainless steel components.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Do you offer custom fabrication?
              </h3>
              <p className="text-gray-600">
                Yes, we work with trusted fabrication partners to provide custom solutions 
                when standard fittings don't meet your specific requirements.
              </p>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                What are your minimum order quantities?
              </h3>
              <p className="text-gray-600">
                We accommodate both small prototype orders and large production runs. 
                Contact us for specific quantities and pricing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="content-container text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you need a single fitting or a complete system solution, 
            our team is ready to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+1234567890"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Call Now
            </a>
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
