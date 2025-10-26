import 'dotenv/config'
import axios from 'axios'
import { WooCommerceProduct } from '../lib/woocommerce/types.js'
import { MedusaProductInput } from '../lib/woocommerce/types.js'
import { CategoryManager } from './category-manager.js'

class WooToMedusaMigration {
  private wooClient: axios.AxiosInstance
  private medusaClient: axios.AxiosInstance
  private authToken: string | null = null
  private categoryManager: CategoryManager

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
      console.error('⚠️  Failed to search products:', error.message)
      return null
    }
  }

  async updateProductPricesAndInventory(productId: string, wooVariations: any[]): Promise<void> {
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

          // Enforce numeric weight, round up, and force min weight of 1
          let weight = typeof wooVariant.weight !== 'undefined' && !isNaN(Number(wooVariant.weight))
            ? Math.ceil(Number(wooVariant.weight))
            : undefined
          if (weight !== undefined && weight < 1) {
            weight = 1
          }

          // Set inventory to 0 if weight is missing or zero (after our rounding and minimum logic)
          const stockQuantity = (weight === undefined || weight === 0)
            ? 0
            : (wooVariant.stock_quantity || 0)

          console.log(`      📦 ${variant.sku}: $${wooPrice.toFixed(2)} → $${newPrice.toFixed(2)} | Stock: ${stockQuantity} | Weight: ${weight}`)

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

          if (variant.inventory_items?.length > 0 && process.env.MEDUSA_LOCATION_ID) {
            const inventoryItemId = variant.inventory_items[0].inventory_item_id
            await this.setInventoryLevel(inventoryItemId, process.env.MEDUSA_LOCATION_ID, stockQuantity)
          }
        } catch (error: any) {
          console.error(`      ❌ Failed ${variant.sku}:`, error.message)
        }
      }

      if (variantUpdates.length > 0) {
        await this.medusaClient.post(`/admin/products/${productId}/variants/batch`, {
          update: variantUpdates
        })
        console.log(`      ✅ Updated ${variantUpdates.length} variants`)
      }

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
        params: { page, per_page: perPage, type: 'variable' }
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
      console.log('🚀 Bulk Price & Inventory Update - ALL Products')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      let successCount = 0
      let skippedCount = 0
      let errorCount = 0
      let totalProcessed = 0
      let page = 1
      let totalPages = 1
      const perPage = 10
      console.log(`📡 Fetching WooCommerce products (${perPage} per page)...\n`)
      while (page <= totalPages) {
        console.log(`📄 Page ${page}/${totalPages === 1 ? '?' : totalPages}`)
        const { products, totalPages: total } = await this.fetchWooProductsPage(page, perPage)
        totalPages = total
        if (products.length === 0) {
          console.log(' No products found on this page\n')
          break
        }
        console.log(` Found ${products.length} products on this page\n`)
        for (const wooProduct of products) {
          totalProcessed++
          try {
            console.log(`   [${totalProcessed}] ${wooProduct.name} (ID: ${wooProduct.id})`)
            const variationsResponse = await this.wooClient.get(`/products/${wooProduct.id}/variations`, {
              params: { per_page: 100 }
            })
            const wooVariations = variationsResponse.data
            if (wooVariations.length === 0) {
              console.log(`      ⚠️  No variations - SKIPPED\n`)
              skippedCount++
              continue
            }
            console.log(`      🔍 Found ${wooVariations.length} variations`)
            const firstSKU = wooVariations[0].sku
            const productId = await this.findProductBySKU(firstSKU)
            if (!productId) {
              console.log(`      ⚠️  Not found in Medusa - SKIPPED\n`)
              skippedCount++
              continue
            }
            await this.updateProductPricesAndInventory(productId, wooVariations)
            console.log(`      ✅ SUCCESS\n`)
            successCount++
            await new Promise(resolve => setTimeout(resolve, 1000))
          } catch (error: any) {
            console.error(`      ❌ ERROR: ${error.message}\n`)
            errorCount++
            continue
          }
        }
        page++
        console.log(` ━━━ Page ${page - 1} Complete: ✅ ${successCount} | ⚠️ ${skippedCount} | ❌ ${errorCount} ━━━\n`)
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎉 BULK UPDATE COMPLETE!')
      console.log(` ✅ Success: ${successCount}`)
      console.log(` ⚠️ Skipped: ${skippedCount}`)
      console.log(` ❌ Errors: ${errorCount}`)
      console.log(` 📊 Total: ${totalProcessed}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } catch (error: any) {
      console.error('\n❌ Bulk update failed:', error.message)
      throw error
    }
  }

  async updateOnly(wooProductId: number): Promise<void> {
    try {
      console.log(`🚀 Price & Inventory Update for WooCommerce product ${wooProductId}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
      console.log('📡 Fetching WooCommerce data...')
      const parentResponse = await this.wooClient.get(`/products/${wooProductId}`)
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
      console.log('🔄 Updating variants...\n')
      await this.updateProductPricesAndInventory(productId, wooVariations)
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`🎉 SUCCESS! Product ${productId} updated`)
      console.log(` • Admin: http://localhost:9000/app/products/${productId}`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } catch (error: any) {
      console.error('\n❌ Update failed:', error.message)
      throw error
    }
  }
}

async function main(): Promise<void> {
  const input = process.argv[2]
  console.log('\n🚀 WooCommerce → Medusa Price & Inventory Updater\n')
  const migration = new WooToMedusaMigration()
  try {
    if (!input) {
      console.error('❌ Please specify a product ID or "all"')
      console.log('\nUsage:')
      console.log(' Single product: npx tsx src/scripts/price-only.ts 521')
      console.log(' All products: npx tsx src/scripts/price-only.ts all')
      process.exit(1)
    }
    if (input.toLowerCase() === 'all') {
      await migration.updateAllProducts()
    } else {
      const productId = parseInt(input)
      if (isNaN(productId)) {
        console.error(`❌ Invalid product ID: "${input}"`)
        console.log('Please provide a valid number or "all"')
        process.exit(1)
      }
      await migration.updateOnly(productId)
    }
  } catch (error: any) {
    console.error('💥 Update failed:', error.message)
    process.exit(1)
  }
}

export { WooToMedusaMigration }
if (require.main === module) { main() }
