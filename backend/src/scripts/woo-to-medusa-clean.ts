// import 'dotenv/config'
// import axios from 'axios'

// // Use your existing types (Medusa AI confirmed they're correct)
// import { WooCommerceProduct } from '../lib/woocommerce/types.js'
// import { MedusaProductInput } from '../lib/woocommerce/types.js'
// import { CategoryManager } from './category-manager.js' // Add this line

// class WooToMedusaMigration {
//   private wooClient: axios.AxiosInstance
//   private medusaClient: axios.AxiosInstance
//   private authToken: string | null = null
//   private categoryManager: CategoryManager // Add this line

//     constructor() {
//     // WooCommerce client - ✅ FIXED: Use correct environment variable names
//     this.wooClient = axios.create({
//         baseURL: `${process.env.WOOCOMMERCE_URL}/wp-json/wc/${process.env.SANITUBE_WC_API_VERSION}`,
//         auth: {
//         username: process.env.WOOCOMMERCE_CONSUMER_KEY!,
//         password: process.env.WOOCOMMERCE_CONSUMER_SECRET!
//         },
//         timeout: parseInt(process.env.SANITUBE_WC_TIMEOUT || '30000')
//     })

//     // Medusa client (unchanged)
//     this.medusaClient = axios.create({
//         baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
//         headers: {
//         'Content-Type': 'application/json'
//         }
//     })

//     this.categoryManager = new CategoryManager()
//     }


//   /**
//    * STEP 1: Transform WooCommerce product to Medusa format
//    * Based on Medusa AI's exact transformation pattern
//    */
//   transformWooToMedusaProduct(wooProduct: WooCommerceProduct, wooVariations: any[] = []): MedusaProductInput {
//     console.log(`🔄 Transforming WooCommerce product: ${wooProduct.name}`)

//     // Map options (attributes used for variations) - Medusa AI pattern
//     const options = (wooProduct.attributes || [])
//       .filter((attr: any) => attr.variation)
//       .map((attr: any) => ({
//         title: attr.name,
//         values: attr.options
//       }))

//     console.log(`   📋 Found ${options.length} options:`, options.map(o => o.title))

//     // Map variants (for variable products) - Medusa AI pattern
//     const variants = wooVariations.map((variation: any) => {
//       // Dynamic options mapping - exactly as Medusa AI specified
//       const variantOptions: Record<string, string> = {}
//       ;(variation.attributes || []).forEach((attr: any) => {
//         variantOptions[attr.name] = attr.option
//       })

//       console.log(`   🔧 Mapping variant ${variation.sku}:`, variantOptions)

//       return {
//         title: variation.name || `${wooProduct.name} Variant`,
//         sku: variation.sku,
//         options: variantOptions,
//         prices: [
//           {
//             amount: Math.round(Number(variation.price) * 100), // Convert to cents
//             currency_code: 'usd'
//           }
//         ],
//         manage_inventory: variation.manage_stock,
//         allow_backorder: variation.backorders_allowed,
//         weight: Number(variation.weight) || undefined,
//         length: Number(variation.dimensions?.length) || undefined,
//         height: Number(variation.dimensions?.height) || undefined,
//         width: Number(variation.dimensions?.width) || undefined,
//         metadata: {
//           woocommerce_id: variation.id
//         }
//       }
//     })

//     console.log(`   ✅ Transformed ${variants.length} variants`)

//     // Build Medusa product - exactly as Medusa AI specified
//     const medusaProduct: MedusaProductInput = {
//         title: wooProduct.name,
//         handle: wooProduct.slug,
//         description: wooProduct.description,
//         status: 'published',       
//         thumbnail: wooProduct.images?.[0]?.src,
//         images: (wooProduct.images || []).map((img: any) => ({ url: img.src })),
//         options,
//         variants,
//         metadata: {
//             woocommerce_id: wooProduct.id
//         },
//         sales_channels: [
//             { id: "sc_01K0AZA26A0C06GVADK4ZCA1EQ" }
//     ]
//     }

//     console.log(`🎯 Transformation complete for: ${medusaProduct.title}`)
//     return medusaProduct
//   }

//   /**
//    * TEST: Fetch WooCommerce product and test transformation
//    */
//   async testTransformation(productId: number): Promise<void> {
//     try {
//       console.log(`🔍 Testing transformation for WooCommerce product ${productId}`)

//       // Fetch parent product
//       console.log('📡 Fetching WooCommerce parent product...')
//       const parentResponse = await this.wooClient.get(`/products/${productId}`)
//       const wooProduct = parentResponse.data

//       // Fetch variations
//       console.log('📡 Fetching WooCommerce variations...')
//       const variationsResponse = await this.wooClient.get(`/products/${productId}/variations`)
//       const wooVariations = variationsResponse.data

//       console.log(`📊 Fetched: 1 parent + ${wooVariations.length} variations`)

//       // Test transformation
//       const medusaProduct = this.transformWooToMedusaProduct(wooProduct, wooVariations)

//       // Show result
//       console.log('\n🎯 TRANSFORMATION RESULT:')
//       console.log('=====================================')
//       console.log(JSON.stringify(medusaProduct, null, 2))
//       console.log('=====================================\n')

//       console.log('✅ Transformation test completed successfully!')

//     } catch (error: any) {
//       console.error('❌ Transformation test failed:', error.message)
//       throw error
//     }
//   }

// /**
//  * Make sure every variant has (a) an inventory_item and
//  * (b) that item is linked to the variant.
//  *
//  * Called once right after the product is created OR
//  * when you discover the product already exists.
//  */
// async ensureInventoryItems(productId: string): Promise<void> {
//   await this.authenticateWithMedusa()

//   /* 1. Get the variants with their inventory links */
//   const { data } = await this.medusaClient.get(`/admin/products/${productId}`, {
//     params: { fields: '*variants,*variants.inventory_items' }
//   })
//   const variants = data.product.variants

//   /* 2. Prepare batch payloads */
//   const createLinks: any[] = []

//   for (const v of variants) {
//     if (v.inventory_items?.length) continue        // already linked

//     /* 2.a Create a bare inventory item (one per variant) */
//     const item = await this.medusaClient.post("/admin/inventory-items", {
//       sku: v.sku,
//       title: v.title
//     })

//     /* 2.b Record the link we need to create */
//     createLinks.push({
//       inventory_item_id: item.data.inventory_item.id,
//       variant_id: v.id,
//       required_quantity: 1                       // “1 unit of this item per variant”
//     })
//   }

//   /* 3. Link new items in one call */
//   if (createLinks.length) {
//     console.log(`🔗 Linking ${createLinks.length} new inventory items …`)
//     await this.medusaClient.post(
//       `/admin/products/${productId}/variants/inventory-items/batch`,
//       { create: createLinks }
//     )
//   }

//   console.log('✅ All variants now have inventory items')
// }






// /**
//  * Authenticate with Medusa admin
//  */
// async authenticateWithMedusa(): Promise<void> {
//   if (this.authToken) return

//   try {
//     console.log('🔐 Authenticating with Medusa admin...')
    
//     const response = await this.medusaClient.post('/auth/user/emailpass', {
//       email: process.env.MEDUSA_ADMIN_EMAIL,
//       password: process.env.MEDUSA_ADMIN_PASSWORD
//     })

//     this.authToken = response.data.token
//     this.medusaClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`
    
//     console.log('✅ Authenticated with Medusa successfully')
//   } catch (error: any) {
//     throw new Error(`Medusa authentication failed: ${error.response?.data?.message || error.message}`)
//   }
// }

// /**
//  * STEP 2: Create product in Medusa
//  */
// async createProductInMedusa(medusaProductData: MedusaProductInput): Promise<any> {
//   try {
//     console.log(`🏗️  STEP 2: Creating product in Medusa: ${medusaProductData.title}`)
    
//     await this.authenticateWithMedusa()
    
//     const response = await this.medusaClient.post('/admin/products', medusaProductData)
//     const createdProduct = response.data.product
    
//     console.log(`✅ Product created successfully!`)
//     console.log(`   • Product ID: ${createdProduct.id}`)
//     console.log(`   • Handle: ${createdProduct.handle}`)
//     console.log(`   • Variants: ${createdProduct.variants?.length || 0}`)
    
//     return createdProduct
    
//   } catch (error: any) {
//     console.error('❌ Failed to create product in Medusa:', error.response?.data || error.message)
//     throw error
//   }
// }

// /**
//  * TEST: Full transformation and creation
//  */
// async testTransformationAndCreation(productId: number): Promise<void> {
//   try {
//     console.log(`🔍 Testing full transformation + creation for WooCommerce product ${productId}`)

//     // Step 1: Transform (existing code)
//     const parentResponse = await this.wooClient.get(`/products/${productId}`)
//     const variationsResponse = await this.wooClient.get(`/products/${productId}/variations`)
//     const medusaProduct = this.transformWooToMedusaProduct(parentResponse.data, variationsResponse.data)

//     // Step 2: Create in Medusa
//     const createdProduct = await this.createProductInMedusa(medusaProduct)

//     console.log('\n🎉 SUCCESS! Product created in Medusa:')
//     console.log(`   • Access via admin: http://localhost:7001/products/${createdProduct.id}`)
//     console.log(`   • Store API: http://localhost:9000/store/products?handle=${createdProduct.handle}`)

//   } catch (error: any) {
//     console.error('❌ Full test failed:', error.message)
//     throw error
//   }
// }





// /**
//  * STEP 3: Complete inventory setup - FIXED for correct JSON structure
//  */
// async completeInventorySetup(productId: string, wooCommerceVariants: any[]): Promise<void> {
//   try {
//     console.log(`🔧 STEP 3: Setting up inventory for product ${productId}`)
    
//     await this.authenticateWithMedusa()
    
//     // Get the product with inventory relationships
//     const response = await this.medusaClient.get(`/admin/products/${productId}`, {
//       params: {
//         fields: '*variants,*variants.inventory_items,*variants.inventory_items.inventory'
//       }
//     })
    
//     const product = response.data.product
//     console.log(`📋 Found ${product.variants.length} variants to process`)
    
//     for (const variant of product.variants) {
//       try {
//         // Find matching WooCommerce data for stock quantity
//         const wooVariant = wooCommerceVariants.find(wv => wv.sku === variant.sku)
//         const stockQuantity = wooVariant ? (wooVariant.stock_quantity || 0) : 0
        
//         // ✅ FIXED: Use correct inventory structure
//         if (variant.inventory_items?.length > 0 && process.env.MEDUSA_LOCATION_ID) {
//           const inventoryItemId = variant.inventory_items[0].inventory_item_id
          
//           console.log(`   📦 Setting ${stockQuantity} units for ${variant.sku}`)
          
//           // Set inventory level at location
//           await this.setInventoryLevel(inventoryItemId, process.env.MEDUSA_LOCATION_ID, stockQuantity)
          
//         } else {
//           console.log(`   ⚠️  Skipping ${variant.sku}: No inventory items found`)
//         }
//       } catch (error: any) {
//         console.error(`   ❌ Failed to set inventory for ${variant.sku}:`, error.message)
//       }
//     }
    
//     console.log('✅ Inventory setup completed')
    
//   } catch (error: any) {
//     console.error('❌ Failed to complete inventory setup:', error.response?.data || error.message)
//     throw error
//   }
// }


// /**
//  * Helper: Set inventory level at location
//  */

// /** Create or update the location-level for one inventory item */
// async setInventoryLevel(itemId: string, locationId: string, qty: number) {
//   try {
//     // try update first
//     await this.medusaClient.post(
//       `/admin/inventory-items/${itemId}/location-levels`,
//       { location_id: locationId, stocked_quantity: qty }
//     )
//   } catch (err: any) {
//     if (err.response?.status === 404 ||
//         err.response?.data?.code === 'item_not_stocked_at_location') {
//       // create level, then retry
//       await this.medusaClient.post(
//         `/admin/inventory-items/${itemId}/location-levels`,
//         { location_id: locationId, stocked_quantity: qty }
//       )
//     } else {
//       throw err
//     }
//   }
// }








// /**
//  * Check if product already exists in Medusa
//  */
// async checkProductExists(handle: string): Promise<string | null> {
//   try {
//     await this.authenticateWithMedusa()
    
//     const response = await this.medusaClient.get('/admin/products', {
//       params: { handle: handle }
//     })
    
//     const existingProduct = response.data.products?.[0]
//     return existingProduct ? existingProduct.id : null
    
//   } catch (error: any) {
//     console.error('⚠️  Failed to check product existence:', error.message)
//     return null
//   }
// }










// /**
//  * COMPLETE TEST: Full WooCommerce → Medusa migration
//  */
// /**
//  * COMPLETE TEST: Full WooCommerce → Medusa migration (handles existing products)
//  */
// /**
//  * COMPLETE TEST: Full WooCommerce → Medusa migration with categories
//  */
// async testCompleteMigration(productId: number, overwriteCategories: boolean = false): Promise<void> {
//   try {
//     console.log(`🚀 Testing complete migration for WooCommerce product ${productId}`)
//     console.log(`📂 Category mode: ${overwriteCategories ? 'REPLACE' : 'ADD'}`)
    
//     // Steps 1-3: Fetch and transform (existing code)
//     const parentResponse = await this.wooClient.get(`/products/${productId}`)
//     const variationsResponse = await this.wooClient.get(`/products/${productId}/variations`)
//     const wooProduct = parentResponse.data
    
//     // Step 2: Process categories FIRST  
//     console.log('📂 Processing product categories...')
//     const categoryIds = await this.categoryManager.ensureCategories(wooProduct.categories || [])
    
//     const medusaProduct = this.transformWooToMedusaProduct(wooProduct, variationsResponse.data)
    
//     // Steps 4-6: Product creation/update (existing code)
//     console.log(`🔍 Checking if product exists: ${medusaProduct.handle}`)
//     const existingProductId = await this.checkProductExists(medusaProduct.handle!)

//     let productToUpdate: string
//     if (existingProductId) {
//       console.log(`✅ Product already exists: ${existingProductId}`)
//       productToUpdate = existingProductId
//     } else {
//       console.log(`🆕 Product doesn't exist, creating new one...`)
//       const createdProduct = await this.createProductInMedusa(medusaProduct)
//       productToUpdate = createdProduct.id
//     }

//     await this.ensureInventoryItems(productToUpdate)

//     if (existingProductId) {
//       const { data } = await this.medusaClient.get(`/admin/products/${existingProductId}`)
//       if (data.product.status !== 'published') {
//         console.log('🔄 Product exists but is draft – publishing it now')
//         await this.medusaClient.post(`/admin/products/${existingProductId}`, { status: 'published' })
//       }
//     }

//     // Step 7: Assign categories with chosen mode
//     if (categoryIds.length > 0) {
//       const mode = overwriteCategories ? 'replace' : 'add'
//       await this.categoryManager.smartAssignCategories(productToUpdate, categoryIds, mode)
//     }

//     await this.completeInventorySetup(productToUpdate, variationsResponse.data)

//     console.log('\n🎉 COMPLETE MIGRATION WITH CATEGORIES SUCCESS!')
//     console.log(`• Product ID: ${productToUpdate}`)
//     console.log(`Description Migration: npx tsx src/scripts/description-to-meta.ts process ${productToUpdate}`)
//     console.log(`• Categories: ${categoryIds.length} ${overwriteCategories ? 'replaced' : 'assigned'}`)
//     console.log(`• Admin: http://localhost:9000/app/products/${productToUpdate}`)

//   } catch (error: any) {
//     console.error('❌ Complete migration failed:', error.message)
//     throw error
//   }
// }





// //end
// }

// // Test runner
// async function main(): Promise<void> {
//   const action = process.argv[2] || 'transform'
//   const productId = parseInt(process.argv[3] || '513')
//   const overwriteCategories = process.argv[4] === '--overwrite-categories'
  
//   console.log(`🚀 Starting WooCommerce → Medusa migration`)
//   console.log(`📦 Action: ${action}, Product ID: ${productId}`)
//   if (overwriteCategories) {
//     console.log(`🔄 Category mode: REPLACE`)
//   }

//   const migration = new WooToMedusaMigration()
  
//   try {
//     if (action === 'complete') {
//       await migration.testCompleteMigration(productId, overwriteCategories)
//     }
//     // ... other actions stay the same
//   } catch (error: any) {
//     console.error('💥 Migration failed:', error.message)
//     process.exit(1)
//   }
// }




// export { WooToMedusaMigration }

// // ✅ ADD THIS - Run if called directly
// if (require.main === module) {
//   main()
// }