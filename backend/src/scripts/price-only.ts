import 'dotenv/config'
import axios from 'axios'
import { WooCommerceProduct } from '../lib/woocommerce/types.js'
import { MedusaProductInput } from '../lib/woocommerce/types.js'
import { CategoryManager } from './category-manager.js'

interface InventoryUpdate {
  inventoryItemId: string
  locationId: string
  stockQuantity: number
  levelId?: string
}

class WooToMedusaMigration {
  private wooClient: axios.AxiosInstance
  private medusaClient: axios.AxiosInstance
  private authToken: string | null = null
  private categoryManager: CategoryManager
  private readonly BATCH_SIZE = 100
  private readonly SHIPPING_PROFILE_ID = process.env.MEDUSA_SHIPPING_PROFILE_ID || 'sp_01K0AZ9QJWS4XD893AAE97WT70'

  constructor() {
    this.wooClient = axios.create({
      baseURL: `${process.env.WOOCOMMERCE_URL}/wp-json/wc/${process.env.SANITUBE_WC_API_VERSION}`,
      auth: {
        username: process.env.WOOCOMMERCE_CONSUMER_KEY!,
        password: process.env.WOOCOMMERCE_CONSUMER_SECRET!
      },
      timeout: 60000
    })

    this.medusaClient = axios.create({
      baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 60000
    })

    this.categoryManager = new CategoryManager()
  }

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
      console.log('✅ Authenticated with Medusa successfully\n')
    } catch (error: any) {
      throw new Error(`Medusa authentication failed: ${error.response?.data?.message || error.message}`)
    }
  }

  /**
   * Extract image URLs from WooCommerce product and variations
   */
  extractWooCommerceImages(wooProduct: any, wooVariations: any[]): string[] {
    const imageUrls: string[] = []

    // Add main product image
    if (wooProduct.images && wooProduct.images.length > 0) {
      wooProduct.images.forEach((img: any) => {
        if (img.src && !imageUrls.includes(img.src)) {
          imageUrls.push(img.src)
        }
      })
    }

    // Add variation images
    wooVariations.forEach(variation => {
      if (variation.image && variation.image.src) {
        if (!imageUrls.includes(variation.image.src)) {
          imageUrls.push(variation.image.src)
        }
      }
    })

    return imageUrls
  }

  /**
   * Update product images in Medusa
   * Medusa v2 accepts direct image URLs
   */
  async updateProductImages(productId: string, imageUrls: string[]): Promise<void> {
    if (imageUrls.length === 0) {
      console.log('      ℹ️ No images to update')
      return
    }

    try {
      await this.authenticateWithMedusa()

      // Medusa v2 accepts images as an array of URL strings
      await this.medusaClient.post(`/admin/products/${productId}`, {
        images: imageUrls.map(url => ({ url }))
      })

      console.log(`      🖼️  Updated ${imageUrls.length} product images`)
    } catch (error: any) {
      console.error(`      ⚠️ Failed to update images: ${error.response?.data?.message || error.message}`)
    }
  }

  async findProductBySKU(sku: string): Promise<string | null> {
    try {
      await this.authenticateWithMedusa()
      const response = await this.medusaClient.get('/admin/products', {
        params: {
          limit: 1000,
          fields: '*variants'
        }
      })

      const products = response.data.products
      for (const product of products) {
        const matchingVariant = product.variants?.find((v: any) => v.sku === sku)
        if (matchingVariant) {
          return product.id
        }
      }
      return null
    } catch (error: any) {
      console.error('⚠️ Failed to search products:', error.message)
      return null
    }
  }

  async getAllMedusaProducts(): Promise<any[]> {
    try {
      await this.authenticateWithMedusa()
      const allProducts: any[] = []
      let offset = 0
      const limit = 100
      let hasMore = true

      console.log('📥 Fetching all Medusa products...')

      while (hasMore) {
        const response = await this.medusaClient.get('/admin/products', {
          params: {
            limit,
            offset,
            fields: 'id,title,variants,variants.inventory_items'
          }
        })

        const products = response.data.products
        allProducts.push(...products)

        console.log(`   Fetched ${allProducts.length} products...`)

        if (products.length < limit) {
          hasMore = false
        } else {
          offset += limit
        }
      }

      console.log(`✅ Total products fetched: ${allProducts.length}\n`)
      return allProducts
    } catch (error: any) {
      console.error('❌ Failed to fetch Medusa products:', error.message)
      throw error
    }
  }

  async updateAllProductShippingProfiles(): Promise<void> {
    try {
      console.log('🚀 Bulk Shipping Profile Update - ALL Products')
      console.log(`📦 Target Shipping Profile: ${this.SHIPPING_PROFILE_ID}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      const products = await this.getAllMedusaProducts()
      let successCount = 0
      let errorCount = 0

      console.log(`🔄 Updating ${products.length} products...\n`)

      for (const product of products) {
        try {
          console.log(`   [${successCount + errorCount + 1}/${products.length}] ${product.title || product.id}`)
          
          await this.medusaClient.post(`/admin/products/${product.id}`, {
            shipping_profile_id: this.SHIPPING_PROFILE_ID
          })

          console.log(`      ✅ Linked to shipping profile`)
          successCount++

          await new Promise(resolve => setTimeout(resolve, 100))
        } catch (error: any) {
          console.error(`      ❌ Failed: ${error.message}`)
          errorCount++
        }
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 SHIPPING PROFILE UPDATE COMPLETE!')
      console.log(`   ✅ Success: ${successCount}`)
      console.log(`   ❌ Errors: ${errorCount}`)
      console.log(`   📊 Total: ${products.length}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } catch (error: any) {
      console.error('\n❌ Shipping profile update failed:', error.message)
      throw error
    }
  }

  async fetchExistingInventoryLevels(inventoryItemId: string): Promise<any[]> {
    try {
      const response = await this.medusaClient.get(
        `/admin/inventory-items/${inventoryItemId}/location-levels`
      )
      return response.data.inventory_item?.location_levels || []
    } catch (error: any) {
      console.error(`      ⚠️ Failed to fetch inventory levels: ${error.message}`)
      return []
    }
  }

  async batchUpdateInventory(updates: InventoryUpdate[]): Promise<void> {
    if (updates.length === 0) {
      console.log('   ℹ️ No inventory updates to process')
      return
    }

    console.log(`\n🔄 Processing ${updates.length} inventory updates in batches of ${this.BATCH_SIZE}...\n`)

    for (let i = 0; i < updates.length; i += this.BATCH_SIZE) {
      const batch = updates.slice(i, i + this.BATCH_SIZE)
      const batchNum = Math.floor(i / this.BATCH_SIZE) + 1
      const totalBatches = Math.ceil(updates.length / this.BATCH_SIZE)

      console.log(`   📦 Batch ${batchNum}/${totalBatches} (${batch.length} items)`)

      try {
        const createPayload: any[] = []
        const updatePayload: any[] = []

        for (const update of batch) {
          const existingLevels = await this.fetchExistingInventoryLevels(update.inventoryItemId)
          const existingLevel = existingLevels.find(
            (level: any) => level.location_id === update.locationId
          )

          if (existingLevel) {
            updatePayload.push({
              id: existingLevel.id,
              inventory_item_id: update.inventoryItemId,
              location_id: update.locationId,
              stocked_quantity: update.stockQuantity
            })
          } else {
            createPayload.push({
              inventory_item_id: update.inventoryItemId,
              location_id: update.locationId,
              stocked_quantity: update.stockQuantity
            })
          }
        }

        const payload: any = {}
        if (createPayload.length > 0) payload.create = createPayload
        if (updatePayload.length > 0) payload.update = updatePayload

        if (Object.keys(payload).length > 0) {
          await this.medusaClient.post('/admin/inventory-items/location-levels/batch', payload)
          console.log(`      ✅ Created: ${createPayload.length}, Updated: ${updatePayload.length}`)
        }

        if (i + this.BATCH_SIZE < updates.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error: any) {
        console.error(`      ❌ Batch failed: ${error.response?.data?.message || error.message}`)
      }
    }

    console.log(`\n✅ Inventory batch update complete!\n`)
  }

  async updateProductPricesAndInventory(
    productId: string, 
    wooProduct: any,
    wooVariations: any[],
    collectInventoryOnly: boolean = false
  ): Promise<InventoryUpdate[]> {
    const inventoryUpdates: InventoryUpdate[] = []

    try {
      await this.authenticateWithMedusa()
      const { data } = await this.medusaClient.get(`/admin/products/${productId}`, {
        params: {
          fields: '*variants,*variants.prices,*variants.inventory_items'
        }
      })

      const variants = data.product.variants
      const variantUpdates: any[] = []

      for (const variant of variants) {
        try {
          const wooVariant = wooVariations.find(wv => wv.sku === variant.sku)
          if (!wooVariant) {
            console.log(`      ⚠️  SKU ${variant.sku}: No WooCommerce data - SKIPPED`)
            continue
          }

          const wooPrice = Number(wooVariant.price)
          const newPrice = wooPrice * 2

          let weight = typeof wooVariant.weight !== 'undefined' && !isNaN(Number(wooVariant.weight))
            ? Math.ceil(Number(wooVariant.weight))
            : undefined
          if (weight !== undefined && weight < 1) {
            weight = 1
          }

          let stockQuantity = (weight === undefined || weight === 0)
            ? 0
            : (wooVariant.stock_quantity || 0)
          
          // Ensure inventory is never negative
          if (stockQuantity < 0) {
            stockQuantity = 0
          }

          console.log(`      📦 ${variant.sku}: $${wooPrice.toFixed(2)} → $${newPrice.toFixed(2)} | Stock: ${stockQuantity} | Weight: ${weight}`)

          if (variant.inventory_items?.length > 0 && process.env.MEDUSA_LOCATION_ID) {
            const inventoryItemId = variant.inventory_items[0].inventory_item_id
            inventoryUpdates.push({
              inventoryItemId,
              locationId: process.env.MEDUSA_LOCATION_ID,
              stockQuantity
            })
          }

          if (!collectInventoryOnly) {
            const existingPrice = variant.prices?.find((p: any) => p.currency_code === 'usd')

            const updatePayload: any = {
              id: variant.id,
              prices: existingPrice
                ? [{ id: existingPrice.id, currency_code: 'usd', amount: newPrice }]
                : [{ currency_code: 'usd', amount: newPrice }]
            }

            if (weight !== undefined) {
              updatePayload.weight = weight
            }
            variantUpdates.push(updatePayload)
          }
        } catch (error: any) {
          console.error(`      ❌ Failed ${variant.sku}:`, error.message)
        }
      }

      if (variantUpdates.length > 0 && !collectInventoryOnly) {
        await this.medusaClient.post(`/admin/products/${productId}/variants/batch`, {
          update: variantUpdates
        })
        console.log(`      ✅ Updated ${variantUpdates.length} variants`)
      }

      // Update product images
      if (!collectInventoryOnly) {
        const imageUrls = this.extractWooCommerceImages(wooProduct, wooVariations)
        if (imageUrls.length > 0) {
          await this.updateProductImages(productId, imageUrls)
        }
      }

      return inventoryUpdates
    } catch (error: any) {
      console.error('      ❌ Update error:', error.message)
      throw error
    }
  }

  async setInventoryLevel(itemId: string, locationId: string, qty: number) {
    try {
      await this.medusaClient.post(`/admin/inventory-items/${itemId}/location-levels/${locationId}`, {
        stocked_quantity: qty
      })
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          await this.medusaClient.post(`/admin/inventory-items/${itemId}/location-levels`, {
            location_id: locationId,
            stocked_quantity: qty
          })
        } catch (createErr: any) {
          console.error(`❌ Inventory error:`, createErr.response?.data || createErr.message)
        }
      }
    }
  }

  async fetchWooProductsPage(page: number, perPage: number = 10): Promise<{ products: any[], totalPages: number }> {
    try {
      const response = await this.wooClient.get('/products', {
        params: {
          page,
          per_page: perPage,
          type: 'variable'
        }
      })

      const products = response.data
      const totalPages = parseInt(response.headers['x-wp-totalpages'] || '1')
      return { products, totalPages }
    } catch (error: any) {
      console.error(`❌ Failed to fetch page ${page}:`, error.message)
      return { products: [], totalPages: 0 }
    }
  }

  async updateAllProducts(): Promise<void> {
    try {
      console.log('🚀 Bulk Price, Inventory & Images Update - ALL Products')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      let successCount = 0
      let skippedCount = 0
      let errorCount = 0
      let totalProcessed = 0
      let page = 1
      let totalPages = 1
      const perPage = 10

      const allInventoryUpdates: InventoryUpdate[] = []

      console.log(`📡 Fetching WooCommerce products (${perPage} per page)...\n`)

      while (page <= totalPages) {
        console.log(`📄 Page ${page}/${totalPages === 1 ? '?' : totalPages}`)
        const { products, totalPages: total } = await this.fetchWooProductsPage(page, perPage)
        totalPages = total

        if (products.length === 0) {
          console.log('   No products found on this page\n')
          break
        }

        console.log(`   Found ${products.length} products on this page\n`)

        for (const wooProduct of products) {
          totalProcessed++

          try {
            console.log(`   [${totalProcessed}] ${wooProduct.name} (ID: ${wooProduct.id})`)

            const variationsResponse = await this.wooClient.get(`/products/${wooProduct.id}/variations`, {
              params: { per_page: 100 }
            })
            const wooVariations = variationsResponse.data

            if (wooVariations.length === 0) {
              console.log(`   ⚠️ No variations - SKIPPED\n`)
              skippedCount++
              continue
            }

            console.log(`   🔍 Found ${wooVariations.length} variations`)

            const firstSKU = wooVariations[0].sku
            const productId = await this.findProductBySKU(firstSKU)

            if (!productId) {
              console.log(`   ⚠️ Not found in Medusa - SKIPPED\n`)
              skippedCount++
              continue
            }

            const inventoryUpdates = await this.updateProductPricesAndInventory(productId, wooProduct, wooVariations)
            allInventoryUpdates.push(...inventoryUpdates)

            console.log(`   ✅ SUCCESS\n`)
            successCount++

            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error: any) {
            console.error(`   ❌ ERROR: ${error.message}\n`)
            errorCount++
            continue
          }
        }

        page++
        console.log(`   ━━━ Page ${page - 1} Complete: ✅ ${successCount} | ⚠️ ${skippedCount} | ❌ ${errorCount} ━━━\n`)
      }

      if (allInventoryUpdates.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📦 BATCH INVENTORY UPDATE')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        await this.batchUpdateInventory(allInventoryUpdates)
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 BULK UPDATE COMPLETE!')
      console.log(`   ✅ Success: ${successCount}`)
      console.log(`   ⚠️ Skipped: ${skippedCount}`)
      console.log(`   ❌ Errors: ${errorCount}`)
      console.log(`   📊 Total: ${totalProcessed}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } catch (error: any) {
      console.error('\n❌ Bulk update failed:', error.message)
      throw error
    }
  }

  async updateInventoryOnly(): Promise<void> {
    try {
      console.log('🚀 Bulk Inventory-Only Update - ALL Products')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      let successCount = 0
      let skippedCount = 0
      let errorCount = 0
      let totalProcessed = 0
      let page = 1
      let totalPages = 1
      const perPage = 10

      const allInventoryUpdates: InventoryUpdate[] = []

      console.log(`📡 Fetching WooCommerce products (${perPage} per page)...\n`)

      while (page <= totalPages) {
        console.log(`📄 Page ${page}/${totalPages === 1 ? '?' : totalPages}`)
        const { products, totalPages: total } = await this.fetchWooProductsPage(page, perPage)
        totalPages = total

        if (products.length === 0) {
          console.log('   No products found on this page\n')
          break
        }

        console.log(`   Found ${products.length} products on this page\n`)

        for (const wooProduct of products) {
          totalProcessed++

          try {
            console.log(`   [${totalProcessed}] ${wooProduct.name} (ID: ${wooProduct.id})`)

            const variationsResponse = await this.wooClient.get(`/products/${wooProduct.id}/variations`, {
              params: { per_page: 100 }
            })
            const wooVariations = variationsResponse.data

            if (wooVariations.length === 0) {
              console.log(`   ⚠️ No variations - SKIPPED\n`)
              skippedCount++
              continue
            }

            console.log(`   🔍 Found ${wooVariations.length} variations`)

            const firstSKU = wooVariations[0].sku
            const productId = await this.findProductBySKU(firstSKU)

            if (!productId) {
              console.log(`   ⚠️ Not found in Medusa - SKIPPED\n`)
              skippedCount++
              continue
            }

            const inventoryUpdates = await this.updateProductPricesAndInventory(productId, wooProduct, wooVariations, true)
            allInventoryUpdates.push(...inventoryUpdates)

            console.log(`   ✅ SUCCESS\n`)
            successCount++

            await new Promise(resolve => setTimeout(resolve, 500))
          } catch (error: any) {
            console.error(`   ❌ ERROR: ${error.message}\n`)
            errorCount++
            continue
          }
        }

        page++
        console.log(`   ━━━ Page ${page - 1} Complete: ✅ ${successCount} | ⚠️ ${skippedCount} | ❌ ${errorCount} ━━━\n`)
      }

      if (allInventoryUpdates.length > 0) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        console.log('📦 BATCH INVENTORY UPDATE')
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
        await this.batchUpdateInventory(allInventoryUpdates)
      }

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 INVENTORY UPDATE COMPLETE!')
      console.log(`   ✅ Success: ${successCount}`)
      console.log(`   ⚠️ Skipped: ${skippedCount}`)
      console.log(`   ❌ Errors: ${errorCount}`)
      console.log(`   📊 Total: ${totalProcessed}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } catch (error: any) {
      console.error('\n❌ Inventory update failed:', error.message)
      throw error
    }
  }

  async updateOnly(wooProductId: number): Promise<void> {
    try {
      console.log(`🚀 Price, Inventory & Images Update for WooCommerce product ${wooProductId}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      console.log('📡 Fetching WooCommerce data...')
      const parentResponse = await this.wooClient.get(`/products/${wooProductId}`)
      const wooProduct = parentResponse.data
      
      const variationsResponse = await this.wooClient.get(`/products/${wooProductId}/variations`, {
        params: { per_page: 100 }
      })

      const wooVariations = variationsResponse.data
      console.log(`✅ Found ${wooVariations.length} variations in WooCommerce\n`)

      if (wooVariations.length === 0) {
        console.log('⚠️ No variations found - nothing to update')
        return
      }

      console.log('🔍 Searching for product in Medusa...')
      const firstSKU = wooVariations[0].sku
      const productId = await this.findProductBySKU(firstSKU)

      if (!productId) {
        console.error('❌ Product not found in Medusa - cannot update')
        console.log('\n💡 TIP: This product may not exist yet.')
        return
      }

      console.log(`✅ Found Medusa product: ${productId}\n`)
      console.log('🔄 Updating variants, prices, and images...\n')

      const inventoryUpdates = await this.updateProductPricesAndInventory(productId, wooProduct, wooVariations)

      if (inventoryUpdates.length > 0) {
        console.log('\n📦 Updating inventory...')
        await this.batchUpdateInventory(inventoryUpdates)
      }

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`🎉 SUCCESS! Product ${productId} updated`)
      console.log(`   • Admin: http://localhost:9000/app/products/${productId}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } catch (error: any) {
      console.error('\n❌ Update failed:', error.message)
      throw error
    }
  }
}

async function main(): Promise<void> {
  const command = process.argv[2]
  const arg = process.argv[3]

  console.log('\n🚀 WooCommerce → Medusa Migration Tool\n')

  const migration = new WooToMedusaMigration()

  try {
    if (!command) {
      console.error('❌ Please specify a command')
      console.log('\nUsage:')
      console.log('  Single product:       npx tsx src/scripts/price-only.ts update 521')
      console.log('  All products:         npx tsx src/scripts/price-only.ts all')
      console.log('  Inventory only:       npx tsx src/scripts/price-only.ts inventory-only')
      console.log('  Shipping profiles:    npx tsx src/scripts/price-only.ts shipping-profiles')
      process.exit(1)
    }

    switch (command.toLowerCase()) {
      case 'all':
        await migration.updateAllProducts()
        break

      case 'inventory-only':
        await migration.updateInventoryOnly()
        break

      case 'shipping-profiles':
        await migration.updateAllProductShippingProfiles()
        break

      case 'update':
        if (!arg) {
          console.error('❌ Please provide a WooCommerce product ID')
          console.log('Usage: npx tsx src/scripts/price-only.ts update 521')
          process.exit(1)
        }
        const productId = parseInt(arg)
        if (isNaN(productId)) {
          console.error(`❌ Invalid product ID: "${arg}"`)
          process.exit(1)
        }
        await migration.updateOnly(productId)
        break

      default:
        console.error(`❌ Unknown command: "${command}"`)
        console.log('\nAvailable commands: all, inventory-only, shipping-profiles, update')
        process.exit(1)
    }
  } catch (error: any) {
    console.error('💥 Operation failed:', error.message)
    process.exit(1)
  }
}

export { WooToMedusaMigration }

if (require.main === module) {
  main()
}
