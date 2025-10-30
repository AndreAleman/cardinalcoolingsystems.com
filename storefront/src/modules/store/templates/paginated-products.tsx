import { getProductsListWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { search } from "@modules/search/actions"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  offset: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
  q?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  countryCode,
  material,
  size,
  q,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  countryCode: string
  material?: string
  size?: string
  q?: string
}) {
  const offset = (page - 1) * PRODUCT_LIMIT
  const region = await getRegion(countryCode)
  
  if (!region) {
    return null
  }

  let products: any[] = []
  let count = 0

  if (q) {
    try {
      const searchResults = await search(q)
      const paginatedResults = searchResults.slice(offset, offset + PRODUCT_LIMIT)
      products = paginatedResults
      count = searchResults.length
    } catch (error) {
      products = []
      count = 0
    }
  } else {
    const queryParams: PaginatedProductsParams = {
      limit: PRODUCT_LIMIT,
      offset,
    }
    if (collectionId) queryParams["collection_id"] = [collectionId]
    if (categoryId) queryParams["category_id"] = [categoryId]
    if (productsIds) queryParams["id"] = productsIds
    if (sortBy === "created_at") queryParams["order"] = "created_at"
    if (material && size) queryParams["q"] = `${material} ${size}`
    else if (material) queryParams["q"] = material
    else if (size) queryParams["q"] = size

    const {
      response: { products: dbProducts, count: dbCount },
    } = await getProductsListWithSort({
      page,
      queryParams,
      sortBy,
      countryCode,
    })
    products = dbProducts
    count = dbCount
  }

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-6 gap-y-8 w-full"
        data-testid="products-list"
      >
        {products.map((p) => (
          <li key={p.id} className="flex flex-col h-full">
            <ProductPreview product={p} region={region} />
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
