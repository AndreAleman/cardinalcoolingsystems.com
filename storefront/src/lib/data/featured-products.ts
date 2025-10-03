import { cache } from "react"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { getProductsList } from "./products"

/**
 * Retrieves featured products from the 'featured-products' collection.
 * @param countryCode - The country code for region-specific pricing.
 * @param limit - The maximum number of products to retrieve.
 * @returns Promise<HttpTypes.StoreProduct[]>
 */
export const getFeaturedProducts = cache(async function (
  countryCode: string,
  limit: number = 8
): Promise<HttpTypes.StoreProduct[]> {
  // 1. Retrieve the collection by handle
  const { collections } = await sdk.store.collection.list(
    { handle: "featured-products" },
    { next: { tags: ["collections"] } }
  )
  const collection = collections[0]
  if (!collection) {
    return []
  }

  // 2. Fetch products from the collection using getProductsList
  const { response } = await getProductsList({
    queryParams: { collection_id: [collection.id], limit },
    countryCode,
  })

  // 3. Return the products
  return response.products
})
