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
  q,  // ← Add search query parameter
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  category_id?: string
  material?: string
  size?: string
  q?: string  // ← Add search query type
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList sortBy={sort} />
      <div className="w-full">
        <div className="mb-8 text-2xl-semi">
          <h1>Store</h1>
          {q && <p className="text-base-regular text-gray-600">Search results for "{q}"</p>}
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category_id}
            countryCode={countryCode}
            material={material}
            size={size}
            q={q}  // ← Pass the search query
          />
        </Suspense>
      </div>
    </div>
  )
}


export default StoreTemplate
