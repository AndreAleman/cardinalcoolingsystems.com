import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

const DEFAULT_LIMIT = 100

export const getCategoriesTree = cache(async (): Promise<HttpTypes.StoreProductCategory[]> => {
  try {
    const { product_categories } = await sdk.store.category.list({
      fields: "id,name,handle,description,category_children.id,category_children.name,category_children.handle",
      include_descendants_tree: true,
      parent_category_id: null,
    })
    return product_categories || []
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
      fields: "id,name,handle,description,metadata,parent_category_id,category_children.id,category_children.name,category_children.handle,category_children.description,category_children.metadata,products.id,products.thumbnail,products.images",
      limit,
      offset,
      ...queryParams,
    })
    return {
      product_categories: product_categories || [],
      count: product_categories?.length || 0,
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
    return product_categories || []
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
      fields: "id,name,handle,description,metadata,parent_category_id,parent_category.id,parent_category.name,parent_category.handle,parent_category.category_children.id,parent_category.category_children.name,parent_category.category_children.handle,parent_category.category_children.description,category_children.id,category_children.name,category_children.handle,category_children.description,category_children.metadata,category_children.products.id,category_children.products.thumbnail,category_children.products.images,products.id,products.thumbnail,products.images",
      handle: [handle],
      limit: 1,
    })

    return { product_categories: product_categories || [] }
  } catch (error) {
    console.error(`❌ Error fetching category by handle ${categoryPath}:`, error)
    return { product_categories: [] }
  }
})
