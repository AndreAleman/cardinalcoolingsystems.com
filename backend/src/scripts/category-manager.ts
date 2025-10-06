import 'dotenv/config'
import axios from 'axios'

interface CategoryInput {
  name: string
  handle?: string
  description?: string
  parent_category_id?: string
}

interface WooCommerceCategory {
  id: number
  name: string
  slug: string
  parent?: number
  description?: string
}

export class CategoryManager {
  private medusaClient: axios.AxiosInstance
  private authToken: string | null = null
  private categoryCache = new Map<number, string>() // WooCommerce ID -> Medusa ID mapping

  constructor() {
    this.medusaClient = axios.create({
      baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * Authenticate with Medusa admin
   */
  async authenticateWithMedusa(): Promise<void> {
    if (this.authToken) return

    try {
      console.log('🔐 Authenticating with Medusa admin...')
      
      const response = await this.medusaClient.post('/auth/user/emailpass', {
        email: process.env.MEDUSA_ADMIN_EMAIL,
        password: process.env.MEDUSA_ADMIN_PASSWORD
      })

      this.authToken = response.data.token
      this.medusaClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`

      console.log('✅ Authenticated with Medusa successfully')
    } catch (error: any) {
      throw new Error(`Medusa authentication failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Check if a category exists by handle
   */
  async checkCategoryExists(handle: string): Promise<string | null> {
    try {
      await this.authenticateWithMedusa()
      
      const response = await this.medusaClient.get('/admin/product-categories', {
        params: { 
          handle: handle,
          limit: 50
        }
      })
      
      const existingCategory = response.data.product_categories?.find(
        (cat: any) => cat.handle === handle
      )
      
      return existingCategory ? existingCategory.id : null
    } catch (error: any) {
      console.error('⚠️ Failed to check category existence:', error.message)
      return null
    }
  }

  /**
   * Generate a URL-friendly handle from category name
   */
  private generateHandle(name: string): string {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Create a category in Medusa
   */
  async createCategoryInMedusa(categoryData: CategoryInput): Promise<any> {
    try {
      console.log(`🏗️ Creating category: ${categoryData.name}${categoryData.parent_category_id ? ' (child)' : ' (parent)'}`)
      await this.authenticateWithMedusa()
      
      const handle = categoryData.handle || this.generateHandle(categoryData.name)
      
      const payload = {
        name: categoryData.name,
        handle: handle,
        description: categoryData.description || null,
        parent_category_id: categoryData.parent_category_id || null,
        is_active: true,
        is_internal: false
      }

      const response = await this.medusaClient.post('/admin/product-categories', payload)
      
      const createdCategory = response.data.product_category
      console.log(`✅ Category created: ${createdCategory.id} (${createdCategory.handle})`)
      return createdCategory
    } catch (error: any) {
      console.error('❌ Failed to create category:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Sort categories by hierarchy (parents first, then children)
   */
  private sortCategoriesByHierarchy(categories: WooCommerceCategory[]): WooCommerceCategory[] {
    const sorted: WooCommerceCategory[] = []
    const processed = new Set<number>()
    
    // Helper function to process category and its dependencies
    const processCategory = (category: WooCommerceCategory): void => {
      if (processed.has(category.id)) return
      
      // If this category has a parent, process the parent first
      if (category.parent) {
        const parentCategory = categories.find(cat => cat.id === category.parent)
        if (parentCategory && !processed.has(parentCategory.id)) {
          processCategory(parentCategory)
        }
      }
      
      // Now process this category
      sorted.push(category)
      processed.add(category.id)
    }
    
    // Process all categories
    for (const category of categories) {
      processCategory(category)
    }
    
    return sorted
  }

  /**
   * Process a single WooCommerce category and ensure it exists in Medusa
   */
  async ensureCategory(wooCategory: WooCommerceCategory): Promise<string> {
    // Check cache first
    if (this.categoryCache.has(wooCategory.id)) {
      return this.categoryCache.get(wooCategory.id)!
    }

    const handle = this.generateHandle(wooCategory.name)
    
    let categoryId = await this.checkCategoryExists(handle)
    
    if (!categoryId) {
      // Determine parent category ID in Medusa
      let parentCategoryId: string | undefined
      if (wooCategory.parent) {
        parentCategoryId = this.categoryCache.get(wooCategory.parent)
        if (!parentCategoryId) {
          console.warn(`⚠️ Parent category ${wooCategory.parent} not found in cache for ${wooCategory.name}`)
        }
      }

      const categoryData: CategoryInput = {
        name: wooCategory.name,
        handle: handle,
        description: wooCategory.description || `Imported from WooCommerce category ID: ${wooCategory.id}`,
        parent_category_id: parentCategoryId
      }
      
      const createdCategory = await this.createCategoryInMedusa(categoryData)
      categoryId = createdCategory.id
    } else {
      console.log(`✅ Category already exists: ${wooCategory.name} (${categoryId})`)
    }
    
    // Cache the mapping
    this.categoryCache.set(wooCategory.id, categoryId)
    return categoryId
  }

  /**
   * Process multiple WooCommerce categories with proper hierarchy handling
   */
  async ensureCategories(wooCategories: WooCommerceCategory[]): Promise<string[]> {
    const categoryIds: string[] = []
    
    if (!wooCategories?.length) {
      return categoryIds
    }

    console.log(`📂 Processing ${wooCategories.length} categories with hierarchy...`)
    
    // Sort categories to ensure parents are created before children
    const sortedCategories = this.sortCategoriesByHierarchy(wooCategories)
    
    console.log('📋 Category processing order:', sortedCategories.map(cat => 
      `${cat.name}${cat.parent ? ` (child of ${cat.parent})` : ' (parent)'}`
    ))
    
    // Process categories in the correct order
    for (const wooCategory of sortedCategories) {
      try {
        const categoryId = await this.ensureCategory(wooCategory)
        if (categoryId) {
          categoryIds.push(categoryId)
        }
      } catch (error: any) {
        console.error(`❌ Failed to process category ${wooCategory.name}:`, error.message)
      }
    }
    
    console.log(`✅ Processed hierarchical categories: ${categoryIds.length}/${wooCategories.length} successful`)
    return categoryIds
  }

  /**
   * Assign a product to categories - Try multiple v2 formats
   */
/**
 * Assign a product to categories (additive) - CORRECT Medusa v2 format
 */
async assignProductToCategories(productId: string, categoryIds: string[]): Promise<void> {
  if (!categoryIds.length) {
    console.log('⏭️ No categories to assign')
    return
  }

  try {
    console.log(`🔗 Adding product ${productId} to ${categoryIds.length} categories`)
    await this.authenticateWithMedusa()
    
    // ✅ CORRECT: Use add/remove format from OpenAPI spec
    for (const categoryId of categoryIds) {
      await this.medusaClient.post(
        `/admin/product-categories/${categoryId}/products`,
        {
          add: [productId],  // Array of product ID strings
          remove: []         // Empty array since we're only adding
        }
      )
    }
    
    console.log('✅ Product assigned to categories successfully')
  } catch (error: any) {
    console.error('❌ Failed to assign product to categories:', error.response?.data || error.message)
  }
}


  /**
   * Replace all categories for a product (instead of just adding) - FIXED for Medusa v2
   */
/**
 * Replace all categories for a product - CORRECT Medusa v2 format
 */
async replaceProductCategories(productId: string, categoryIds: string[]): Promise<void> {
  try {
    console.log(`🔄 Replacing ALL categories for product ${productId} with ${categoryIds.length} new categories`)
    await this.authenticateWithMedusa()
    
    // Step 1: Get current product with its categories
    const productResponse = await this.medusaClient.get(`/admin/products/${productId}`, {
      params: { fields: '*categories' }
    })
    
    const currentCategories = productResponse.data.product.categories || []
    console.log(`📋 Current categories: ${currentCategories.length}`)
    
    // Step 2: Remove product from ALL current categories
    if (currentCategories.length > 0) {
      console.log('🗑️ Removing product from existing categories...')
      for (const currentCategory of currentCategories) {
        try {
          await this.medusaClient.post(
            `/admin/product-categories/${currentCategory.id}/products`,
            {
              add: [],              // Empty array since we're only removing
              remove: [productId]   // Remove this product
            }
          )
        } catch (error: any) {
          console.warn(`⚠️ Failed to remove from category ${currentCategory.id}:`, error.message)
        }
      }
    }
    
    // Step 3: Add product to new categories
    if (categoryIds.length > 0) {
      console.log('➕ Adding product to new categories...')
      for (const categoryId of categoryIds) {
        await this.medusaClient.post(
          `/admin/product-categories/${categoryId}/products`,
          {
            add: [productId],   // Add this product
            remove: []          // Empty array since we're only adding
          }
        )
      }
    }
    
    console.log('✅ Product categories completely replaced')
  } catch (error: any) {
    console.error('❌ Failed to replace product categories:', error.response?.data || error.message)
  }
}


  /**
   * Smart category assignment - detects changes and updates accordingly
   */
  async smartAssignCategories(productId: string, newCategoryIds: string[], mode: 'add' | 'replace' = 'add'): Promise<void> {
    if (mode === 'replace') {
      await this.replaceProductCategories(productId, newCategoryIds)
    } else {
      await this.assignProductToCategories(productId, newCategoryIds)
    }
  }

  /**
   * List all categories with hierarchy (for debugging)
   */
  async listAllCategories(): Promise<any[]> {
    try {
      await this.authenticateWithMedusa()
      
      const response = await this.medusaClient.get('/admin/product-categories', {
        params: { 
          limit: 100,
          include_descendants_tree: true
        }
      })
      
      return response.data.product_categories || []
    } catch (error: any) {
      console.error('❌ Failed to list categories:', error.message)
      return []
    }
  }

  /**
   * Clear the category cache (useful for testing)
   */
  clearCache(): void {
    this.categoryCache.clear()
  }
}

// Test runner for standalone usage with hierarchy
async function testCategoryManagerWithHierarchy(): Promise<void> {
  const manager = new CategoryManager()
  
  // Test hierarchical categories (child references parent)
  const testCategories: WooCommerceCategory[] = [
    { id: 1, name: 'Electronics', slug: 'electronics' },
    { id: 3, name: 'Smartphones', slug: 'smartphones', parent: 1 }, // Child first (tests sorting)
    { id: 2, name: 'Computers', slug: 'computers', parent: 1 },
    { id: 4, name: 'Laptops', slug: 'laptops', parent: 2 }, // Grandchild
    { id: 5, name: 'Gaming Laptops', slug: 'gaming-laptops', parent: 4 } // Great-grandchild
  ]
  
  try {
    console.log('🧪 Testing hierarchical category manager...')
    
    const categoryIds = await manager.ensureCategories(testCategories)
    console.log('📋 Created/found categories:', categoryIds)
    
    const allCategories = await manager.listAllCategories()
    console.log(`📊 Total categories in Medusa: ${allCategories.length}`)
    
    // Show hierarchy
    console.log('\n🌳 Category Hierarchy:')
    allCategories.forEach(cat => {
      const indent = cat.parent_category_id ? '  └─ ' : '├─ '
      console.log(`${indent}${cat.name} (${cat.handle})`)
    })
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message)
  }
}

if (require.main === module) {
  testCategoryManagerWithHierarchy()
}
