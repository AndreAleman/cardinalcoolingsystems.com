import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"
import {
  nonEmptyCategoryIds,
  pruneEmptyCategories,
} from "@lib/util/category-visibility"

const DEFAULT_LIMIT = 100

/**
 * Ids of categories with at least one published product (directly or in a
 * descendant). Empty categories are hidden from navigation, listings and the
 * sitemap, and their pages 404 — Google Merchant Center rejects empty
 * categories. Returns null when the lookup fails so callers fail open
 * (show everything) instead of emptying the navigation.
 */
export const getVisibleCategoryIds = cache(async (): Promise<Set<string> | null> => {
  try {
    const { product_categories } = await sdk.store.category.list({
      fields: "id,parent_category_id,products.id",
      limit: 500,
    })
    return nonEmptyCategoryIds((product_categories || []) as any)
  } catch (error) {
    console.error("Error fetching category visibility:", error)
    return null
  }
})

const visibleOnly = <T extends { id: string }>(
  categories: T[],
  visibleIds: Set<string> | null
): T[] => (visibleIds ? pruneEmptyCategories(categories, visibleIds) : categories)

export const getCategoriesTree = cache(async (): Promise<HttpTypes.StoreProductCategory[]> => {
  try {
    const { product_categories } = await sdk.store.category.list({
      fields: "id,name,handle,description,category_children.id,category_children.name,category_children.handle",
      include_descendants_tree: true,
      parent_category_id: null,
    })
    return visibleOnly(product_categories || [], await getVisibleCategoryIds())
  } catch (error) {
    console.error("Error fetching categories tree:", error)
    return []
  }
})

export const getCategoriesList = cache(async (
  offset: number = 0,
  limit: number = DEFAULT_LIMIT,
  queryParams?: { parent_category_id?: null | string }
): Promise<{
  product_categories: HttpTypes.StoreProductCategory[]
  count: number
}> => {
  try {
    const { product_categories } = await sdk.store.category.list({
      // Include category_children for subcategory display + products for thumbnail logic
      fields: "id,name,handle,description,metadata,parent_category_id,category_children.id,category_children.name,category_children.handle,category_children.description,category_children.metadata,products.id,products.thumbnail,products.images.url",
      limit,
      offset,
      ...queryParams,
    })
    const visible = visibleOnly(product_categories || [], await getVisibleCategoryIds())
    return {
      product_categories: visible,
      count: visible.length,
    }
  } catch (error) {
    console.error("Error fetching categories list:", error)
    return { product_categories: [], count: 0 }
  }
})

export const listCategories = cache(async (): Promise<HttpTypes.StoreProductCategory[]> => {
  try {
    const { product_categories } = await sdk.store.category.list({
      fields: "id,name,handle,description,metadata",
      limit: 100,
    })
    return visibleOnly(product_categories || [], await getVisibleCategoryIds())
  } catch (error) {
    console.error("Error fetching categories list:", error)
    return []
  }
})

export const getCategoryByHandle = cache(async (categoryPath: string[] | string): Promise<{
  product_categories: HttpTypes.StoreProductCategory[]
}> => {
  try {
    const handles = Array.isArray(categoryPath) ? categoryPath : [categoryPath]
    const handle = handles[handles.length - 1]

    const { product_categories } = await sdk.store.category.list({
      // Include everything needed: subcategories, parent (for sibling logic), products for images
      fields: "id,name,handle,description,metadata,parent_category_id,parent_category.id,parent_category.name,parent_category.handle,parent_category.category_children.id,parent_category.category_children.name,parent_category.category_children.handle,parent_category.category_children.description,category_children.id,category_children.name,category_children.handle,category_children.description,category_children.metadata,category_children.products.id,category_children.products.thumbnail,category_children.products.images.url,products.id,products.thumbnail,products.images.url",
      handle: [handle],
      limit: 1,
    })

    // An empty category resolves to "not found" so its page 404s; its
    // subcategory and sibling lists lose their empty entries too.
    const visibleIds = await getVisibleCategoryIds()
    if (!visibleIds) return { product_categories: product_categories || [] }
    const visible = pruneEmptyCategories(product_categories || [], visibleIds).map(
      (c: any) =>
        c.parent_category?.category_children
          ? {
              ...c,
              parent_category: {
                ...c.parent_category,
                category_children: pruneEmptyCategories(
                  c.parent_category.category_children,
                  visibleIds
                ),
              },
            }
          : c
    )
    return { product_categories: visible }
  } catch (error) {
    console.error(`❌ Error fetching category by handle ${categoryPath}:`, error)
    return { product_categories: [] }
  }
})
