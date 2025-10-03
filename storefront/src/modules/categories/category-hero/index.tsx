"use client"

type Props = {
  categoryName: string
  description: string
  breadcrumbs?: Array<{
    label: string
    href: string
  }>
  productCount?: number
}

export default function CategoryHero({ 
  categoryName, 
  description, 
  breadcrumbs = [],
  productCount 
}: Props) {
  return (
    <section className="py-16 px-4 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-8">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
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
                <span className="text-gray-900 font-medium">{categoryName}</span>
              </li>
            </ol>
          </nav>
        )}

        {/* Category Title and Description */}
        <div className="max-w-4xl">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            {categoryName}
          </h1>
          
          <p className="text-lg text-gray-600 leading-relaxed mb-4">
            {description}
          </p>

          {/* Product Count */}
          {productCount && (
            <p className="text-sm text-gray-500">
              {productCount} products available
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
