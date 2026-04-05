import { Suspense } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "./paginated-products"

const StoreTemplate = ({
  sortBy,
  page,
  countryCode,
  category_id,
  material,
  size,
  q,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  category_id?: string
  material?: string
  size?: string
  q?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-8">

        {/* Search result label */}
        {q && (
          <p className="text-sm font-light mb-6" style={{ color: "#6b7280" }}>
            Search results for <span className="font-medium text-gray-900">&ldquo;{q}&rdquo;</span>
          </p>
        )}

        <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-start">
          {/* Sidebar — desktop only, mobile is handled inside RefinementList */}
          <RefinementList sortBy={sort} />

          {/* Products */}
          <div className="flex-1 min-w-0">
            <Suspense fallback={<SkeletonProductGrid />}>
              <PaginatedProducts
                sortBy={sort}
                page={pageNumber}
                categoryId={category_id}
                countryCode={countryCode}
                material={material}
                size={size}
                q={q}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StoreTemplate
