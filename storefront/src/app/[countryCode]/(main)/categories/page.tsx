import { Metadata } from "next"
import { getCategoriesList } from "@lib/data/categories"
import Link from "next/link"

type Props = {
  params: { countryCode: string }
}

export const metadata: Metadata = {
  title: "Product Categories | Cardinal Cooling Systems",
  description: "Browse our complete range of sanitary stainless steel products including tubes, valves, fittings, and more. Shop by category to find exactly what you need.",
  alternates: {
    canonical: "https://www.cardinalcoolingsystems.com/us/categories",
  },
}

export default async function CategoriesPage({ params }: Props) {
  const { product_categories } = await getCategoriesList(0, 100)

  // Only top-level parent categories (no parent_category_id)
  const parentCategories = product_categories?.filter(
    (c) => !c.parent_category_id
  ) || []

  // Shuffle for random order
  const shuffled = [...parentCategories].sort(() => Math.random() - 0.5)

  const getImage = (category: any): string | null => {
    if (category.metadata?.image) return category.metadata.image as string
    if (category.metadata?.featured_image) return category.metadata.featured_image as string
    const products = category.products ?? []
    for (const p of products) {
      if (p.thumbnail) return p.thumbnail
      if (p.images?.[0]?.url) return p.images[0].url
    }
    return null
  }

  return (
    <div className="bg-white">

      {/* Hero */}
      <section className="pt-40 pb-16 px-6 lg:px-12" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto max-w-[1440px]">
          <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href={`/${params.countryCode}`} className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>Categories</span>
          </nav>
          <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
            Full Catalogue
          </p>
          <h1 className="font-sans text-4xl lg:text-6xl font-normal tracking-tight text-white leading-tight mb-4 max-w-2xl">
            Shop by Category
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
            Precision-engineered sanitary stainless steel products for food processing, pharmaceuticals, data centers, and industrial applications.
          </p>
        </div>
      </section>

      {/* Categories grid */}
      <section className="py-20 px-6 lg:px-12 bg-white">
        <div className="mx-auto max-w-[1440px]">
          {shuffled.length === 0 ? (
            <p className="text-sm font-light text-center" style={{ color: "#9ca3af" }}>No categories found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {shuffled.map((category) => {
                const image = getImage(category)
                const childCount = category.category_children?.length ?? 0
                const productCount = (category.products ?? []).length

                return (
                  <Link
                    key={category.id}
                    href={`/${params.countryCode}/categories/${category.handle}`}
                    className="group block overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 bg-white"
                    style={{ borderRadius: "5px" }}
                  >
                    {/* Image */}
                    <div className="overflow-hidden relative" style={{ aspectRatio: "4/3", backgroundColor: "#f8f8f8" }}>
                      {image ? (
                        <img
                          src={image}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-12 h-12" style={{ color: "#d1d5db" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                          </svg>
                        </div>
                      )}
                      {/* Count badge */}
                      {(productCount > 0 || childCount > 0) && (
                        <span
                          className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1"
                          style={{ backgroundColor: "rgba(255,255,255,0.92)", borderRadius: "4px", color: "#333" }}
                        >
                          {childCount > 0 ? `${childCount} subcategories` : `${productCount} products`}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div className="p-5">
                      <h2 className="text-base font-semibold mb-2 transition-colors group-hover:text-red-600" style={{ color: "#111111" }}>
                        {category.name}
                      </h2>
                      {category.description && (
                        <p className="text-xs font-light leading-relaxed mb-3 line-clamp-2" style={{ color: "#6b7280" }}>
                          {category.description}
                        </p>
                      )}

                      {/* Subcategory pills */}
                      {category.category_children && category.category_children.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {category.category_children.slice(0, 3).map((child) => (
                            <span
                              key={child.id}
                              className="text-xs px-2 py-0.5 font-light"
                              style={{ backgroundColor: "#f8f8f8", color: "#6b7280", borderRadius: "3px" }}
                            >
                              {child.name}
                            </span>
                          ))}
                          {category.category_children.length > 3 && (
                            <span className="text-xs px-2 py-0.5 font-light" style={{ backgroundColor: "#f8f8f8", color: "#9ca3af", borderRadius: "3px" }}>
                              +{category.category_children.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      <span className="inline-flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: "#E3000F" }}>
                        Browse category
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}
