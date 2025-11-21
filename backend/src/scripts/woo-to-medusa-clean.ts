// import 'dotenv/config'
// import axios from 'axios'

// import { WooCommerceProduct } from '../lib/woocommerce/types.js'
// import { MedusaProductInput } from '../lib/woocommerce/types.js'
// import { CategoryManager } from './category-manager.js'

// class WooToMedusaMigration {
//   private wooClient: axios.AxiosInstance
//   private medusaClient: axios.AxiosInstance
//   private authToken: string | null = null
//   private categoryManager: CategoryManager

//   private skippedVariants: Array<{
//     productId: number
//     productName: string
//     sku: string
//     variantName: string
//     reason: string
//     missingOptions: string[]
//   }> = []

//   constructor() {
//     this.wooClient = axios.create({
//       baseURL: `${process.env.WOOCOMMERCE_URL}/wp-json/wc/${process.env.SANITUBE_WC_API_VERSION}`,
//       auth: {
//         username: process.env.WOOCOMMERCE_CONSUMER_KEY!,
//         password: process.env.WOOCOMMERCE_CONSUMER_SECRET!
//       },
//       timeout: parseInt(process.env.SANITUBE_WC_TIMEOUT || '30000')
//     })

//     this.medusaClient = axios.create({
//       baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
//       headers: { 'Content-Type': 'application/json' }
//     })

//     this.categoryManager = new CategoryManager()
//   }

//   /**
//    * Authenticate with Medusa
//    */
//   async authenticateWithMedusa(): Promise<void> {
//     if (this.authToken) return

//     try {
//       console.log('🔐 Authenticating with Medusa admin...')
      
//       const response = await this.medusaClient.post('/auth/user/emailpass', {
//         email: process.env.MEDUSA_ADMIN_EMAIL,
//         password: process.env.MEDUSA_ADMIN_PASSWORD
//       })

//       this.authToken = response.data.token
//       this.medusaClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`
      
//       console.log('✅ Authenticated with Medusa successfully')
//     } catch (error: any) {
//       throw new Error(`Medusa authentication failed: ${error.response?.data?.message || error.message}`)
//     }
//   }

//   /**
//    * Get all VARIABLE products from WooCommerce (excluding Custom category)
//    */
//   async getAllVariableProducts(): Promise<number[]> {
//     try {
//       console.log('📡 Fetching all variable products from WooCommerce...')

//       let page = 1
//       let variableProducts: number[] = []
//       let hasMore = true

//       while (hasMore) {
//         const response = await this.wooClient.get('/products', {
//           params: {
//             per_page: 100,
//             page: page,
//             status: 'publish',
//             type: 'variable'
//           }
//         })

//         const products = response.data

//         // Filter out Custom category
//         const filteredProducts = products.filter((p: any) => {
//           const categories = p.categories || []
//           const hasCustomCategory = categories.some(
//             (cat: any) => cat.name.toLowerCase() === 'custom'
//           )

//           if (hasCustomCategory) {
//             console.log(`   ⏭️  Skipping: ${p.name} (Custom category)`)
//             return false
//           }

//           return true
//         })

//         variableProducts.push(...filteredProducts.map((p: any) => p.id))

//         console.log(`   📦 Page ${page}: ${filteredProducts.length}/${products.length} variable products`)

//         hasMore = products.length === 100
//         page++
//       }

//       console.log(`✅ Total variable products found: ${variableProducts.length}`)
//       return variableProducts

//     } catch (error: any) {
//       console.error('❌ Failed to fetch products:', error.message)
//       throw error
//     }
//   }

//   /**
//    * Get all SKUs currently in Medusa database
//    */
//   async getAllMedusaSKUs(): Promise<Set<string>> {
//     try {
//       console.log('📡 Fetching all SKUs from Medusa database...')

//       await this.authenticateWithMedusa()

//       const response = await this.medusaClient.get('/admin/products', {
//         params: {
//           limit: 9999,
//           fields: '*variants'
//         }
//       })

//       const allSKUs = new Set<string>()
      
//       response.data.products.forEach((product: any) => {
//         product.variants?.forEach((variant: any) => {
//           if (variant.sku) {
//             allSKUs.add(variant.sku)
//           }
//         })
//       })

//       console.log(`✅ Found ${allSKUs.size} SKUs in Medusa database`)
//       return allSKUs

//     } catch (error: any) {
//       console.error('❌ Failed to fetch Medusa SKUs:', error.message)
//       throw error
//     }
//   }

//   /**
//    * Check if product exists by handle
//    */
//   async checkProductExists(handle: string): Promise<string | null> {
//     try {
//       await this.authenticateWithMedusa()
      
//       const response = await this.medusaClient.get('/admin/products', {
//         params: { handle: handle }
//       })
      
//       const existingProduct = response.data.products?.[0]
//       return existingProduct ? existingProduct.id : null
      
//     } catch (error: any) {
//       return null
//     }
//   }

//   /**
//    * Get full product details including options
//    */
//   async getProductWithOptions(productId: string): Promise<any> {
//     try {
//       await this.authenticateWithMedusa()
      
//       const response = await this.medusaClient.get(`/admin/products/${productId}`, {
//         params: { fields: '*options' }
//       })
      
//       return response.data.product
      
//     } catch (error: any) {
//       console.error(`❌ Failed to get product details:`, error.message)
//       throw error
//     }
//   }

//   /**
//    * ✅ NEW: Normalize option values to ensure consistency
//    * Adds quotes to numeric values that should have them
//    */
//   private normalizeOptionValue(optionTitle: string, value: string): string {
//     // For size-related options, ensure numeric values have quotes
//     const sizeRelatedOptions = ['size', 'tube od', 'od', 'diameter', 'tube']
//     const isSize = sizeRelatedOptions.some(keyword => 
//       optionTitle.toLowerCase().includes(keyword)
//     )
    
//     if (isSize) {
//       // If it's a plain number (1, 2, 10, etc.) add quotes
//       if (/^\d+$/.test(value)) {
//         return `${value}"`
//       }
//       // If it already has proper formatting (1", 1-1/2", etc.), leave it
//       return value
//     }
    
//     return value
//   }

//   /**
//    * ✅ UPDATED: Ensure product has all required option values
//    * Adds missing option values to product options if needed
//    * Returns normalized option values for variant creation
//    */
//   async ensureProductHasOptionValues(
//     productId: string, 
//     productName: string,
//     variantOptions: Record<string, string>
//   ): Promise<Record<string, string>> {
//     try {
//       const product = await this.getProductWithOptions(productId)
//       const productOptions = product.options || []
      
//       // ✅ NEW: Track normalized values
//       const normalizedVariantOptions: Record<string, string> = {}
      
//       let needsUpdate = false
//       const updatedOptions = productOptions.map((opt: any) => {
//         const optionTitle = opt.title
//         const variantValue = variantOptions[optionTitle]
        
//         // If this variant has a value for this option
//         if (variantValue) {
//           // ✅ NEW: Normalize the value
//           const normalizedValue = this.normalizeOptionValue(optionTitle, variantValue)
//           normalizedVariantOptions[optionTitle] = normalizedValue
          
//           const existingValues = opt.values || []
//           const valueExists = existingValues.some((v: any) => v.value === normalizedValue)
          
//           if (!valueExists) {
//             console.log(`   🔧 Adding "${normalizedValue}" to option "${optionTitle}"`)
//             needsUpdate = true
//             return {
//               id: opt.id,
//               title: opt.title,
//               values: [...existingValues.map((v: any) => v.value), normalizedValue]
//             }
//           }
//         } else {
//           // Option not present in variant, keep existing values
//           normalizedVariantOptions[optionTitle] = variantOptions[optionTitle]
//         }
        
//         return {
//           id: opt.id,
//           title: opt.title,
//           values: opt.values.map((v: any) => v.value)
//         }
//       })
      
//       // Update product with new option values if needed
//       if (needsUpdate) {
//         await this.medusaClient.post(`/admin/products/${productId}`, {
//           options: updatedOptions
//         })
//         console.log(`   ✅ Updated product options`)
//       }
      
//       // ✅ NEW: Return normalized values to use for variant creation
//       return normalizedVariantOptions
      
//     } catch (error: any) {
//       console.error(`   ❌ Failed to update product options:`, error.message)
//       throw error
//     }
//   }

//   /**
//    * Transform WooCommerce product to Medusa format
//    */
//   transformWooToMedusaProduct(wooProduct: WooCommerceProduct, wooVariations: any[]): MedusaProductInput {
//     const options = (wooProduct.attributes || [])
//       .filter((attr: any) => attr.variation)
//       .map((attr: any) => ({
//         title: attr.name,
//         values: attr.options
//       }))

//     const validVariants: any[] = []
//     const optionTitles = options.map(opt => opt.title)

//     wooVariations.forEach((variation: any) => {
//       const variantOptions: Record<string, string> = {}
      
//       // Add all the variant's option values
//       ;(variation.attributes || []).forEach((attr: any) => {
//         variantOptions[attr.name] = attr.option
//       })

//       // Check if variant has all required options
//       const missingOptions = optionTitles.filter(title => !variantOptions[title])
      
//       if (missingOptions.length > 0) {
//         // Skip this variant and track it
//         console.log(`   ⏭️  Skipping ${variation.sku}: Missing options: ${missingOptions.join(', ')}`)
        
//         this.skippedVariants.push({
//           productId: wooProduct.id,
//           productName: wooProduct.name,
//           sku: variation.sku,
//           variantName: variation.name || variation.sku,
//           reason: 'Incomplete option values',
//           missingOptions: missingOptions
//         })
        
//         return // Skip this variant
//       }

//       // Variant has all options - add it
//       validVariants.push({
//         title: variation.name || `${wooProduct.name} Variant`,
//         sku: variation.sku,
//         options: variantOptions,
//         prices: [{
//           amount: Math.round(Number(variation.price) * 2),
//           currency_code: 'usd'
//         }],
//         manage_inventory: variation.manage_stock,
//         allow_backorder: variation.backorders_allowed,
//         weight: Number(variation.weight) || undefined,
//         length: Number(variation.dimensions?.length) || undefined,
//         height: Number(variation.dimensions?.height) || undefined,
//         width: Number(variation.dimensions?.width) || undefined,
//         metadata: { woocommerce_id: variation.id }
//       })
//     })

//     console.log(`   ✅ Valid variants: ${validVariants.length}/${wooVariations.length}`)

//     return {
//       title: wooProduct.name,
//       handle: wooProduct.slug,
//       description: wooProduct.description,
//       status: 'published',
//       thumbnail: wooProduct.images?.[0]?.src,
//       images: (wooProduct.images || []).map((img: any) => ({ url: img.src })),
//       options,
//       variants: validVariants,
//       metadata: { woocommerce_id: wooProduct.id },
//       sales_channels: [{ id: "sc_01K0AZA26A0C06GVADK4ZCA1EQ" }]
//     }
//   }

//   /**
//    * Create product in Medusa
//    */
//   async createProductInMedusa(medusaProductData: MedusaProductInput): Promise<any> {
//     await this.authenticateWithMedusa()
    
//     try {
//       const response = await this.medusaClient.post('/admin/products', medusaProductData)
//       return response.data.product
//     } catch (error: any) {
//       console.error(`\n❌ Failed to create product in Medusa:`)
//       console.error(`   Error: ${error.message}`)
      
//       if (error.response?.data) {
//         console.error(`   Details:`, JSON.stringify(error.response.data, null, 2))
//       }
      
//       if (error.response?.status) {
//         console.error(`   Status: ${error.response.status}`)
//       }
      
//       console.error(`\n📦 Payload that failed:`)
//       console.error(JSON.stringify(medusaProductData, null, 2))
      
//       throw error
//     }
//   }

//   /**
//    * Add missing variant to existing product
//    */
//   async addVariantToProduct(productId: string, variantData: any): Promise<void> {
//     await this.authenticateWithMedusa()
    
//     await this.medusaClient.post(
//       `/admin/products/${productId}/variants`,
//       variantData
//     )
//   }

//   /**
//    * Ensure inventory items exist
//    */
//   async ensureInventoryItems(productId: string): Promise<void> {
//     await this.authenticateWithMedusa()

//     const { data } = await this.medusaClient.get(`/admin/products/${productId}`, {
//       params: { fields: '*variants,*variants.inventory_items' }
//     })
//     const variants = data.product.variants

//     const createLinks: any[] = []

//     for (const v of variants) {
//       if (v.inventory_items?.length) continue

//       const item = await this.medusaClient.post("/admin/inventory-items", {
//         sku: v.sku,
//         title: v.title
//       })

//       createLinks.push({
//         inventory_item_id: item.data.inventory_item.id,
//         variant_id: v.id,
//         required_quantity: 1
//       })
//     }

//     if (createLinks.length) {
//       await this.medusaClient.post(
//         `/admin/products/${productId}/variants/inventory-items/batch`,
//         { create: createLinks }
//       )
//     }
//   }

//   /**
//    * Set inventory levels
//    */
//   async completeInventorySetup(productId: string, wooCommerceVariants: any[]): Promise<void> {
//     await this.authenticateWithMedusa()
    
//     const response = await this.medusaClient.get(`/admin/products/${productId}`, {
//       params: {
//         fields: '*variants,*variants.inventory_items'
//       }
//     })
    
//     const product = response.data.product
    
//     for (const variant of product.variants) {
//       try {
//         const wooVariant = wooCommerceVariants.find(wv => wv.sku === variant.sku)
//         const stockQuantity = wooVariant ? (wooVariant.stock_quantity || 0) : 0
        
//         if (variant.inventory_items?.length > 0 && process.env.MEDUSA_LOCATION_ID) {
//           const inventoryItemId = variant.inventory_items[0].inventory_item_id
          
//           await this.setInventoryLevel(inventoryItemId, process.env.MEDUSA_LOCATION_ID, stockQuantity)
//         }
//       } catch (error: any) {
//         console.error(`   ❌ Failed to set inventory for ${variant.sku}:`, error.message)
//       }
//     }
//   }

//   async setInventoryLevel(itemId: string, locationId: string, qty: number) {
//     try {
//       await this.medusaClient.post(
//         `/admin/inventory-items/${itemId}/location-levels`,
//         { location_id: locationId, stocked_quantity: qty }
//       )
//     } catch (err: any) {
//       console.error(`      🔴 Error details:`, err.response?.data || err.message)
      
//       if (err.response?.status === 404) {
//         await this.medusaClient.post(
//           `/admin/inventory-items/${itemId}/location-levels`,
//           { location_id: locationId, stocked_quantity: qty }
//         )
//       } else {
//         throw err
//       }
//     }
//   }

//   /**
//    * MAIN: Process variable product family
//    */
//   async processVariableProduct(productId: number, medusaSKUs: Set<string>, dryRun: boolean): Promise<{ success: boolean, addedVariants: number }> {
//     try {
//       console.log(`\n${'='.repeat(70)}`)
//       console.log(`🔍 Processing Variable Product: ${productId}`)

//       const parentResponse = await this.wooClient.get(`/products/${productId}`)
//       const wooProduct = parentResponse.data

//       const variationsResponse = await this.wooClient.get(`/products/${productId}/variations`, {
//         params: { per_page: 100 }
//       })
//       const wooVariations = variationsResponse.data

//       console.log(`   • Total variants in WooCommerce: ${wooVariations.length}`)

//       // Check which SKUs are missing
//       const missingVariants = wooVariations.filter(v => !medusaSKUs.has(v.sku))
//       const existingVariants = wooVariations.filter(v => medusaSKUs.has(v.sku))

//       console.log(`   • Existing in Medusa: ${existingVariants.length}`)
//       console.log(`   • Missing from Medusa: ${missingVariants.length}`)

//       if (missingVariants.length === 0) {
//         console.log('✅ All variants already exist in Medusa')
//         return { success: true, addedVariants: 0 }
//       }

//       if (dryRun) {
//         console.log(`\n📋 DRY RUN - Would add these variants:`)
//         missingVariants.forEach(v => {
//           console.log(`   • ${v.sku} - ${v.name}`)
//         })
//         return { success: true, addedVariants: missingVariants.length }
//       }

//       // Check if parent product exists
//       const existingProductId = await this.checkProductExists(wooProduct.slug)

//       let productId_medusa: string
//       let variantsAdded = 0

//       if (existingProductId) {
//         console.log(`✅ Parent product exists: ${existingProductId}`)
//         productId_medusa = existingProductId

//         // Add missing variants with option value management
//         console.log(`🔄 Adding ${missingVariants.length} missing variants...`)
        
//         for (const wooVariant of missingVariants) {
//           try {
//             const variantOptions: Record<string, string> = {}
//             ;(wooVariant.attributes || []).forEach((attr: any) => {
//               variantOptions[attr.name] = attr.option
//             })

//             // ✅ UPDATED: Ensure product has all option values AND get normalized values
//             const normalizedOptions = await this.ensureProductHasOptionValues(
//               productId_medusa, 
//               wooProduct.name,
//               variantOptions
//             )

//             const variantPayload = {
//               title: wooVariant.name || `${wooProduct.name} Variant`,
//               sku: wooVariant.sku,
//               options: normalizedOptions, // ✅ USE NORMALIZED VALUES
//               prices: [{
//                 amount: Math.round(Number(wooVariant.price) * 2),
//                 currency_code: 'usd'
//               }],
//               manage_inventory: wooVariant.manage_stock,
//               allow_backorder: wooVariant.backorders_allowed,
//               weight: Number(wooVariant.weight) || undefined,
//               metadata: { woocommerce_id: wooVariant.id }
//             }

//             await this.addVariantToProduct(productId_medusa, variantPayload)
//             console.log(`   ✅ Added variant: ${wooVariant.sku}`)
//             variantsAdded++

//           } catch (variantError: any) {
//             console.log(`   ⏭️  Skipping ${wooVariant.sku}: ${variantError.response?.data?.message || variantError.message}`)
            
//             this.skippedVariants.push({
//               productId: wooProduct.id,
//               productName: wooProduct.name,
//               sku: wooVariant.sku,
//               variantName: wooVariant.name || wooVariant.sku,
//               reason: variantError.response?.data?.message || variantError.message,
//               missingOptions: []
//             })
            
//             continue
//           }
//         }

//       } else {
//         console.log(`🆕 Parent product doesn't exist, creating with all variants...`)
        
//         // Process categories
//         const categoryIds = await this.categoryManager.ensureCategories(wooProduct.categories || [])
        
//         // Transform and create
//         const medusaProduct = this.transformWooToMedusaProduct(wooProduct, wooVariations)
        
//         // Only create if there are valid variants
//         if (medusaProduct.variants.length === 0) {
//           console.log(`⚠️  No valid variants to create - skipping product`)
//           return { success: true, addedVariants: 0 }
//         }
        
//         const createdProduct = await this.createProductInMedusa(medusaProduct)
//         productId_medusa = createdProduct.id
//         variantsAdded = medusaProduct.variants.length

//         console.log(`✅ Created product: ${productId_medusa}`)

//         // Assign categories
//         if (categoryIds.length > 0) {
//           await this.categoryManager.smartAssignCategories(productId_medusa, categoryIds, 'add')
//         }
//       }

//       // Only proceed with inventory if variants were added
//       if (variantsAdded > 0) {
//         // Ensure inventory items
//         await this.ensureInventoryItems(productId_medusa)
        
//         // Set inventory levels
//         await this.completeInventorySetup(productId_medusa, wooVariations)

//         console.log(`🎉 SUCCESS! Added ${variantsAdded} variants`)
//       } else {
//         console.log(`⚠️  No variants added (all skipped due to errors)`)
//       }
      
//       return { success: true, addedVariants: variantsAdded }

//     } catch (error: any) {
//       console.error(`❌ Failed to process product ${productId}:`, error.message)
      
//       if (error.response?.data) {
//         console.error(`📋 Error details:`, JSON.stringify(error.response.data, null, 2))
//       }
//       return { success: false, addedVariants: 0 }
//     }
//   }

//   /**
//    * BULK MIGRATION: Process all variable products
//    */
//   async bulkMigrateVariableProducts(dryRun: boolean = false): Promise<void> {
//     try {
//       console.log('🚀 Starting variable product migration...')
//       console.log(`📋 Mode: ${dryRun ? 'DRY RUN (first 5 products only)' : 'LIVE MIGRATION'}`)

//       // Get all variable products
//       const variableProducts = await this.getAllVariableProducts()

//       // Get all SKUs in Medusa
//       const medusaSKUs = await this.getAllMedusaSKUs()

//       // Limit to 5 for dry run
//       const productsToProcess = dryRun ? variableProducts.slice(0, 5) : variableProducts

//       console.log(`\n📊 Processing ${productsToProcess.length} variable products...\n`)

//       let successCount = 0
//       let failCount = 0
//       let totalVariantsAdded = 0

//       for (const productId of productsToProcess) {
//         const result = await this.processVariableProduct(productId, medusaSKUs, dryRun)
        
//         if (result.success) {
//           successCount++
//           totalVariantsAdded += result.addedVariants
//         } else {
//           failCount++
//         }
//       }

//       console.log(`\n${'='.repeat(70)}`)
//       console.log('🎉 MIGRATION COMPLETE!')
//       console.log(`   ✅ Successful products: ${successCount}`)
//       console.log(`   ❌ Failed products: ${failCount}`)
//       console.log(`   📊 Total variants added: ${totalVariantsAdded}`)
//       console.log(`   ⏭️  Total variants skipped: ${this.skippedVariants.length}`)
//       console.log(`   📈 Total products processed: ${productsToProcess.length}`)

//       // Export skipped variants
//       if (!dryRun) {
//         await this.exportSkippedVariantsCSV()
//       }

//     } catch (error: any) {
//       console.error('💥 Bulk migration failed:', error.message)
//       throw error
//     }
//   }

//   /**
//    * Export skipped variants to CSV
//    */
//   async exportSkippedVariantsCSV(): Promise<void> {
//     if (this.skippedVariants.length === 0) {
//       console.log('\n✅ No skipped variants to export')
//       return
//     }

//     const fs = await import('fs')
//     const csvContent = [
//       // Header
//       'Product ID,Product Name,SKU,Variant Name,Reason,Missing Options',
//       // Data rows
//       ...this.skippedVariants.map(v => 
//         `${v.productId},"${v.productName}",${v.sku},"${v.variantName}","${v.reason}","${v.missingOptions.join('; ')}"`
//       )
//     ].join('\n')

//     const filename = `skipped-variants-${Date.now()}.csv`
//     fs.writeFileSync(filename, csvContent)
    
//     console.log(`\n📄 Exported ${this.skippedVariants.length} skipped variants to: ${filename}`)
//   }
// }

// // Main runner
// async function main(): Promise<void> {
//   const action = process.argv[2] || 'bulk'
//   const productIdArg = process.argv[3]
//   const dryRunArg = process.argv[4] || process.argv[3]

//   console.log(`🚀 Starting WooCommerce → Medusa Variable Product Migration`)

//   const migration = new WooToMedusaMigration()

//   try {
//     if (action === 'single') {
//       const productId = parseInt(productIdArg)
//       const dryRun = dryRunArg === '--dry-run'
      
//       if (!productId || isNaN(productId)) {
//         console.error('❌ Please provide a product ID: npx tsx ... single 521')
//         process.exit(1)
//       }

//       console.log(`📋 Mode: ${dryRun ? 'DRY RUN' : 'LIVE'} - Single Product`)
//       console.log(`🎯 Testing product ID: ${productId}\n`)

//       // Get Medusa SKUs
//       const medusaSKUs = await migration.getAllMedusaSKUs()

//       // Process single product
//       const result = await migration.processVariableProduct(productId, medusaSKUs, dryRun)

//       console.log(`\n${'='.repeat(70)}`)
//       if (result.success) {
//         console.log(`✅ SUCCESS! ${dryRun ? 'Would add' : 'Added'} ${result.addedVariants} variants`)
//       } else {
//         console.log(`❌ FAILED to process product ${productId}`)
//       }

//     } else if (action === 'bulk') {
//       const dryRun = productIdArg === '--dry-run'
//       await migration.bulkMigrateVariableProducts(dryRun)
//     }

//   } catch (error: any) {
//     console.error('💥 Migration failed:', error.message)
//     process.exit(1)
//   }
// }

// export { WooToMedusaMigration }

// if (require.main === module) {
//   main()
// }
 