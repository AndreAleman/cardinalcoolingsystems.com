import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"
import { cache } from "react"

const DEFAULT_LIMIT = 100

// Get hierarchical categories using the official Medusa recommended approach
export const getCategoriesTree = cache(async (): Promise<HttpTypes.StoreProductCategory[]> => {
  try {
    const { product_categories } = await sdk.store.category.list({
      fields: "id,name,handle,description,category_children.id,category_children.name,category_children.handle",
      include_descendants_tree: true,
      parent_category_id: null,
    })
    
    console.log('🌳 Categories tree fetched:', product_categories?.length || 0, 'categories')
    return product_categories || []
  } catch (error) {
    console.error("Error fetching categories tree:", error)
    return []
  }
})

// Add the function your footer is using
export const getCategoriesList = cache(async (
  offset: number = 0,
  limit: number = DEFAULT_LIMIT
): Promise<{
  product_categories: HttpTypes.StoreProductCategory[]
  count: number
}> => {
  try {
    const { product_categories } = await sdk.store.category.list({
      fields: "id,name,handle,description,metadata,parent_category",
      limit,
      offset,
    })
    
    return {
      product_categories: product_categories || [],
      count: product_categories?.length || 0
    }
  } catch (error) {
    console.error("Error fetching categories list:", error)
    return {
      product_categories: [],
      count: 0
    }
  }
})

// Add the functions your existing pages are using
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

// Fix this function with better error handling
export const getCategoryByHandle = cache(async (categoryPath: string[] | string): Promise<{
  product_categories: HttpTypes.StoreProductCategory[]
}> => {
  try {
    // Handle both string and array inputs
    const handles = Array.isArray(categoryPath) ? categoryPath : [categoryPath]
    const handle = handles[handles.length - 1] // Get the last handle in the path
    
    console.log('🔍 Looking for category with handle:', handle)
    
    const { product_categories } = await sdk.store.category.list({
      fields: "id,name,handle,description,metadata",
      handle: [handle],
      limit: 1,
    })
    
    console.log('📦 Found categories:', product_categories?.length || 0)
    if (product_categories?.length > 0) {
      console.log('✅ Category found:', product_categories[0].name)
    }
    
    return {
      product_categories: product_categories || []
    }
  } catch (error) {
    console.error(`❌ Error fetching category by handle ${categoryPath}:`, error)
    return {
      product_categories: []
    }
  }
})
