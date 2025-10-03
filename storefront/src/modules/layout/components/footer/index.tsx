import { getCategoriesList } from "@lib/data/categories"
import { Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function Footer() {
  // Fetch more categories to get all parent categories
  const { product_categories } = await getCategoriesList(0, 50) // Increased limit

  // Filter to get only parent categories
  const parentCategories = product_categories?.filter(c => !c.parent_category && !c.parent_category_id) || []
  
  // Split categories into two columns for better layout
  const midPoint = Math.ceil(parentCategories.length / 2)
  const firstColumnCategories = parentCategories.slice(0, midPoint)
  const secondColumnCategories = parentCategories.slice(midPoint)

  return (
    <footer className="bg-blue-600 text-white w-full">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
          
          {/* Company Info */}
          <div className="lg:col-span-1">
            <LocalizedClientLink
              href="/"
              className="text-2xl font-bold text-white hover:text-blue-100 transition-colors"
            >
              Cowbird Depot
            </LocalizedClientLink>
            <p className="mt-4 text-blue-100 text-sm leading-relaxed">
              Premium stainless steel sanitary fittings for food processing, 
              pharmaceuticals, brewing, and industrial applications. Quality you can trust.!!!!!!!!
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-2">
              <p className="text-sm text-blue-100">
                <span className="font-medium">Email:</span>{" "}
                <a href="mailto:info@cowbirddepot.com" className="hover:text-white transition-colors">
                  info@cowbirddepot.com
                </a>
              </p>
              <p className="text-sm text-blue-100">
                <span className="font-medium">Phone:</span>{" "}
                <a href="tel:+1234567890" className="hover:text-white transition-colors">
                  (123) 456-7890
                </a>
              </p>
            </div>
          </div>

          {/* Product Categories - First Column */}
          {parentCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">
                Product Categories
              </h3>
              <ul className="space-y-2">
                {firstColumnCategories.map((c) => (
                  <li key={c.id}>
                    <LocalizedClientLink
                      className="text-blue-100 hover:text-white transition-colors text-sm"
                      href={`/categories/${c.handle}`}
                      data-testid="category-link"
                    >
                      {c.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Product Categories - Second Column (overflow) */}
          {secondColumnCategories.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 lg:opacity-0">
                Categories Continued
              </h3>
              <ul className="space-y-2">
                {secondColumnCategories.map((c) => (
                  <li key={c.id}>
                    <LocalizedClientLink
                      className="text-blue-100 hover:text-white transition-colors text-sm"
                      href={`/categories/${c.handle}`}
                      data-testid="category-link"
                    >
                      {c.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Links & Support */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <LocalizedClientLink
                  href="/about"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  About Us
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/blog"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Blog
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/contact"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/shipping-returns"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Shipping & Returns
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/technical-support"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Technical Support
                </LocalizedClientLink>
              </li>
              <li>
                <LocalizedClientLink
                  href="/bulk-orders"
                  className="text-blue-100 hover:text-white transition-colors text-sm"
                >
                  Bulk Orders
                </LocalizedClientLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-blue-500 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Stay Updated
              </h3>
              <p className="text-blue-100 text-sm">
                Get the latest product updates and industry insights.
              </p>
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 bg-blue-700 border border-blue-500 text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 rounded"
              />
              <button className="px-6 py-2 bg-white text-blue-600 font-medium hover:bg-blue-50 transition-colors rounded">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="border-t border-blue-500 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap gap-4 text-sm text-blue-200">
              <LocalizedClientLink 
                href="/privacy-policy" 
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </LocalizedClientLink>
              <LocalizedClientLink 
                href="/terms-of-service" 
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </LocalizedClientLink>
              <LocalizedClientLink 
                href="/cookie-policy" 
                className="hover:text-white transition-colors"
              >
                Cookie Policy
              </LocalizedClientLink>
            </div>
            
            <Text className="text-sm text-blue-200">
              © {new Date().getFullYear()} Cowbird Depot. All rights reserved.
            </Text>
          </div>
        </div>
      </div>
    </footer>
  )
}
