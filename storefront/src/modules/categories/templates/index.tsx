import { notFound } from "next/navigation"
import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  categories,
  allCategories = [],
  sortBy,
  page,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  allCategories?: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const category = categories[categories.length - 1]

  if (!category || !countryCode) notFound()

  const getImage = (cat: any): string | null => {
    if (cat.metadata?.image) return cat.metadata.image as string
    if (cat.metadata?.featured_image) return cat.metadata.featured_image as string
    const products = cat.products ?? []
    for (const p of products) {
      if (p.thumbnail) return p.thumbnail
      if (p.images?.[0]?.url) return p.images[0].url
    }
    return null
  }

  const categoryImage = getImage(category)

  // All OTHER categories — exclude current one, shuffle for variety
  const otherCategories = allCategories
    .filter((c) => c.id !== category.id)
    .sort(() => Math.random() - 0.5)

  return (
    <div className="bg-white">

      {/* Category hero image */}
      {categoryImage && (
        <div
          className="w-full flex items-center justify-center"
          style={{ backgroundColor: "#f0f4f8", maxHeight: "480px", overflow: "hidden" }}
        >
          <img
            src={categoryImage}
            alt={category.name}
            style={{ maxHeight: "480px", width: "100%", objectFit: "contain", display: "block" }}
          />
        </div>
      )}

      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">

        {/* Category description */}
        {category.description && (
          <div className="py-8 max-w-3xl border-b border-gray-100">
            <p className="text-sm font-light leading-relaxed" style={{ color: "#555555" }}>
              {category.description}
            </p>
          </div>
        )}

        {/* ALL other categories — horizontal scroll row */}
        {otherCategories.length > 0 && (
          <div className="py-10 border-b border-gray-100">
            <p className="text-xs font-normal tracking-widest uppercase mb-5" style={{ color: "#E3000F" }}>
              Browse All Categories
            </p>

            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {otherCategories.map((cat) => {
                const img = getImage(cat)
                return (
                  <LocalizedClientLink
                    key={cat.id}
                    href={`/categories/${cat.handle}`}
                    className="group flex-none block overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 bg-white"
                    style={{
                      borderRadius: "5px",
                      // ~1.5 visible on mobile, ~2.5 on tablet, more on desktop
                      width: "clamp(160px, 40vw, 220px)",
                    }}
                  >
                    <div
                      className="overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "1/1", backgroundColor: "#f8f8f8" }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={cat.name}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
<div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: "#E3000F" }}>
  <img
    src="/images/logo/new-cardinal-cooling-logo.svg"
    alt="Cardinal Cooling Systems"
    className="w-full h-auto"
    style={{ filter: "brightness(0) invert(1)" }}
  />
</div>
                      )}
                    </div>
                    <div className="p-3">
                      <p
                        className="text-xs font-semibold leading-snug transition-colors group-hover:text-red-600 line-clamp-2"
                        style={{ color: "#111111" }}
                      >
                        {cat.name}
                      </p>
                    </div>
                  </LocalizedClientLink>
                )
              })}
            </div>
          </div>
        )}

        {/* Products section */}
        <div className="py-10">
          <p className="text-xs font-normal tracking-widest uppercase mb-6" style={{ color: "#E3000F" }}>
            Products
          </p>
          <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-start">
            <RefinementList sortBy={sort} data-testid="sort-by-container" />
            <div className="flex-1 min-w-0">
              <Suspense fallback={<SkeletonProductGrid />}>
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  categoryId={category.id}
                  countryCode={countryCode}
                />
              </Suspense>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
