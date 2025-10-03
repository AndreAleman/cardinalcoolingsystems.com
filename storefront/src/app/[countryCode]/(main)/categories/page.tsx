import { Metadata } from "next"
import { listCategories } from "@lib/data/categories"
import { StoreProductCategory } from "@medusajs/types"
import Link from "next/link"

type Props = {
  params: {
    countryCode: string
  }
}

export const metadata: Metadata = {
  title: "Product Categories - Sanitube",
  description: "Browse our complete range of sanitary stainless steel products including tubes, valves, and fittings.",
}

export default async function CategoriesPage({ params }: Props) {
  const categories = await listCategories()

  const breadcrumbs = [
    { label: "Home", href: `/${params.countryCode}` }
  ]

  return (
    <>
      {/* Categories Hero Section */}
      <section className="py-16 px-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  <Link 
                    href={crumb.href}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                </li>
              ))}
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium">Categories</span>
              </li>
            </ol>
          </nav>

          {/* Page Title and Description */}
          <div className="max-w-4xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Product Categories
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Explore our complete range of sanitary stainless steel products. From precision-engineered tubing to industrial valves and fittings, find the perfect solution for your application.
            </p>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories?.map((category: StoreProductCategory) => {
              const featuredImage = category.metadata?.featured_image as string | undefined

              return (
                <div key={category.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden">
                  {/* Category Image */}
                  <div className="aspect-[4/3] overflow-hidden">
                    {featuredImage ? (
                      <img
                        src={featuredImage}
                        alt={category.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      // Fallback placeholder
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <div className="text-center">
                          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-500 text-sm font-medium">{category.name}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {category.name}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {category.description || `Browse our selection of ${category.name.toLowerCase()} products for sanitary and industrial applications.`}
                    </p>
                    
                    <Link 
                      href={`/${params.countryCode}/categories/${category.handle}`}
                      className="inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors"
                    >
                      View Products
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
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </>
  )
}
