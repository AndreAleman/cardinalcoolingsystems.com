import { Metadata } from "next"

import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Shop All Products - Sanitube",
  description: "Explore our complete range of sanitary stainless steel products including tubes, valves, and fittings.",
}

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    category_id?: string      // ← Add filter parameters
    material?: string        // ← Add filter parameters
    size?: string   
    q?: string        // ← Add filter parameters
  }
  params: {
    countryCode: string
  }
}

export default async function StorePage({ searchParams, params }: Params) {
  const { sortBy, page, category_id, material, size, q } = searchParams  // ← Extract filter params

  const breadcrumbs = [
    { label: "Home", href: `/${params.countryCode}` }
  ]

  return (
    <>
      {/* Shop Hero Section */}
      <section className="py-16 px-4 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  <a 
                    href={crumb.href}
                    className="hover:text-emerald-800 transition-colors"
                  >
                    {crumb.label}
                  </a>
                </li>
              ))}
              <li className="flex items-center">
                <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-900 font-medium">Shop</span>
              </li>
            </ol>
          </nav>

          {/* Page Title and Description */}
          <div className="max-w-4xl">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Shop All Products
            </h1>
            
            <p className="text-lg text-gray-600 leading-relaxed mb-4">
              Discover our complete collection of precision-engineered sanitary stainless steel products. From welded tubing to industrial valves and fittings, find everything you need for your sanitary and industrial applications.
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span>✓ ASTM A269 & A270 Standards</span>
              <span>✓ 3A Specifications</span>
              <span>✓ Industrial Grade Quality</span>
              <span>✓ Fast Shipping Available</span>
            </div>
          </div>
        </div>
      </section>

      {/* Store Template with Filter Parameters */}
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      category_id={category_id}    // ← Use category_id
      material={material}
      size={size}
      q={searchParams.q} 
    />

    </>
  )
}
