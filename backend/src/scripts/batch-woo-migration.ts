// import 'dotenv/config'
// import fs from 'fs'
// import path from 'path'
// import * as XLSX from 'xlsx'
// import { WooToMedusaMigration } from './woo-to-medusa-clean.js'

// interface MigrationResult {
//   woo_product_id: number
//   woo_sku?: string
//   product_title?: string
//   status: 'success' | 'error' | 'skipped'
//   medusa_product_id?: string
//   medusa_handle?: string
//   categories_assigned?: number
//   variants_count?: number
//   error_message?: string
//   processed_at: string
//   duration_seconds?: number
// }

// class BatchWooMigration {
//   private migration: WooToMedusaMigration
//   private results: MigrationResult[] = []
//   private logFile: string

//   constructor(logFile: string = 'migration-results.csv') {
//     this.migration = new WooToMedusaMigration()
//     this.logFile = logFile
    
//     // Initialize CSV with headers
//     this.initializeResultsFile()
//   }

//   /**
//    * Initialize CSV file with headers
//    */
//   private initializeResultsFile(): void {
//     const headers = [
//       'woo_product_id',
//       'woo_sku',
//       'product_title', 
//       'status',
//       'medusa_product_id',
//       'medusa_handle',
//       'categories_assigned',
//       'variants_count',
//       'error_message',
//       'processed_at',
//       'duration_seconds'
//     ].join(',') + '\n'

//     if (!fs.existsSync(this.logFile)) {
//       fs.writeFileSync(this.logFile, headers)
//       console.log(`📄 Created results log: ${this.logFile}`)
//     }
//   }

//   /**
//    * Read product IDs from Excel/CSV file
//    */
//   private readProductIdsFromFile(filePath: string): number[] {
//     console.log(`📂 Reading product IDs from: ${filePath}`)
    
//     try {
//       const workbook = XLSX.readFile(filePath)
//       const firstSheetName = workbook.SheetNames[0]
//       const worksheet = workbook.Sheets[firstSheetName]
//       const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

//       // Extract product IDs - assumes they're in the first column
//       const productIds: number[] = []
      
//       for (let i = 0; i < data.length; i++) {
//         const row = data[i] as any[]
//         if (row && row[0]) {
//           const id = parseInt(String(row[0]).trim())
//           if (!isNaN(id) && id > 0) {
//             productIds.push(id)
//           }
//         }
//       }

//       console.log(`✅ Found ${productIds.length} product IDs`)
//       return productIds

//     } catch (error: any) {
//       console.error('❌ Failed to read file:', error.message)
//       throw error
//     }
//   }

//   /**
//    * Migrate a single product with error handling
//    */
//   private async migrateSingleProduct(
//     productId: number, 
//     overwriteCategories: boolean = false
//   ): Promise<MigrationResult> {
//     const startTime = Date.now()
//     const result: MigrationResult = {
//       woo_product_id: productId,
//       status: 'error',
//       processed_at: new Date().toISOString()
//     }

//     try {
//       console.log(`\n🔄 Processing product ${productId}...`)
//       console.log('='.repeat(60))

//       // Use the existing migration method but capture the result
//       const migrationResult = await this.runMigrationWithCapture(productId, overwriteCategories)
      
//       // Update result with success data
//       result.status = 'success'
//       result.woo_sku = migrationResult.sku
//       result.product_title = migrationResult.title
//       result.medusa_product_id = migrationResult.medusaProductId
//       result.medusa_handle = migrationResult.handle
//       result.categories_assigned = migrationResult.categoriesCount
//       result.variants_count = migrationResult.variantsCount

//       console.log(`✅ SUCCESS: ${result.product_title}`)

//     } catch (error: any) {
//       result.status = 'error'
//       result.error_message = error.message || 'Unknown error'
      
//       console.error(`❌ FAILED: Product ${productId}`)
//       console.error(`   Error: ${result.error_message}`)
//     }

//     result.duration_seconds = Math.round((Date.now() - startTime) / 1000)
//     return result
//   }

//   /**
//    * Enhanced migration method that captures results
//    */
//   private async runMigrationWithCapture(
//     productId: number, 
//     overwriteCategories: boolean
//   ): Promise<{
//     sku: string
//     title: string
//     medusaProductId: string
//     handle: string
//     categoriesCount: number
//     variantsCount: number
//   }> {
//     // Fetch WooCommerce data
//     const parentResponse = await this.migration['wooClient'].get(`/products/${productId}`)
//     const variationsResponse = await this.migration['wooClient'].get(`/products/${productId}/variations`)
//     const wooProduct = parentResponse.data

//     // Process categories
//     const categoryIds = await this.migration['categoryManager'].ensureCategories(wooProduct.categories || [])

//     // Transform product
//     const medusaProduct = this.migration.transformWooToMedusaProduct(wooProduct, variationsResponse.data)

//     // Check if exists or create
//     const existingProductId = await this.migration['checkProductExists'](medusaProduct.handle!)
    
//     let productToUpdate: string
//     if (existingProductId) {
//       productToUpdate = existingProductId
//     } else {
//       const createdProduct = await this.migration['createProductInMedusa'](medusaProduct)
//       productToUpdate = createdProduct.id
//     }

//     // Setup inventory and categories
//     await this.migration['ensureInventoryItems'](productToUpdate)
    
//     if (categoryIds.length > 0) {
//       const mode = overwriteCategories ? 'replace' : 'add'
//       await this.migration['categoryManager'].smartAssignCategories(productToUpdate, categoryIds, mode)
//     }

//     await this.migration['completeInventorySetup'](productToUpdate, variationsResponse.data)

//     return {
//       sku: medusaProduct.variants?.[0]?.sku || 'N/A',
//       title: medusaProduct.title,
//       medusaProductId: productToUpdate,
//       handle: medusaProduct.handle || '',
//       categoriesCount: categoryIds.length,
//       variantsCount: medusaProduct.variants?.length || 0
//     }
//   }

//   /**
//    * Log result to CSV
//    */
//   private logResult(result: MigrationResult): void {
//     const csvRow = [
//       result.woo_product_id,
//       result.woo_sku || '',
//       `"${(result.product_title || '').replace(/"/g, '""')}"`,
//       result.status,
//       result.medusa_product_id || '',
//       result.medusa_handle || '',
//       result.categories_assigned || 0,
//       result.variants_count || 0,
//       `"${(result.error_message || '').replace(/"/g, '""')}"`,
//       result.processed_at,
//       result.duration_seconds || 0
//     ].join(',') + '\n'

//     fs.appendFileSync(this.logFile, csvRow)
//   }

//   /**
//    * Run batch migration
//    */
//   async runBatch(
//     filePath: string, 
//     overwriteCategories: boolean = false,
//     startFrom: number = 0,
//     maxProducts?: number
//   ): Promise<void> {
//     console.log(`🚀 Starting batch WooCommerce → Medusa migration`)
//     console.log(`📂 Input file: ${filePath}`)
//     console.log(`📄 Results log: ${this.logFile}`)
//     console.log(`🔄 Category mode: ${overwriteCategories ? 'REPLACE' : 'ADD'}`)
    
//     if (startFrom > 0) {
//       console.log(`⏭️ Starting from product #${startFrom + 1}`)
//     }
    
//     if (maxProducts) {
//       console.log(`🔢 Max products to process: ${maxProducts}`)
//     }

//     try {
//       // Read product IDs
//       const allProductIds = this.readProductIdsFromFile(filePath)
      
//       // Apply start and limit filters
//       let productIds = allProductIds.slice(startFrom)
//       if (maxProducts) {
//         productIds = productIds.slice(0, maxProducts)
//       }

//       console.log(`\n📊 Processing ${productIds.length} products (of ${allProductIds.length} total)\n`)

//       // Process each product
//       let successCount = 0
//       let errorCount = 0

//       for (let i = 0; i < productIds.length; i++) {
//         const productId = productIds[i]
//         const overallIndex = startFrom + i + 1

//         console.log(`\n🔢 Product ${overallIndex}/${allProductIds.length}: ${productId}`)
        
//         try {
//           const result = await this.migrateSingleProduct(productId, overwriteCategories)
//           this.results.push(result)
//           this.logResult(result)

//           if (result.status === 'success') {
//             successCount++
//           } else {
//             errorCount++
//           }

//           // Brief pause between products to avoid overwhelming APIs
//           await new Promise(resolve => setTimeout(resolve, 1000))

//         } catch (error: any) {
//           console.error(`💥 Critical error processing ${productId}:`, error.message)
          
//           const errorResult: MigrationResult = {
//             woo_product_id: productId,
//             status: 'error',
//             error_message: `Critical error: ${error.message}`,
//             processed_at: new Date().toISOString()
//           }
          
//           this.results.push(errorResult)
//           this.logResult(errorResult)
//           errorCount++
//         }
//       }

//       // Final summary
//       console.log(`\n${'='.repeat(80)}`)
//       console.log(`🎉 BATCH MIGRATION COMPLETE`)
//       console.log(`${'='.repeat(80)}`)
//       console.log(`✅ Successful: ${successCount}`)
//       console.log(`❌ Failed: ${errorCount}`)
//       console.log(`📊 Total processed: ${successCount + errorCount}`)
//       console.log(`📄 Results logged to: ${this.logFile}`)
//       console.log(`${'='.repeat(80)}`)

//     } catch (error: any) {
//       console.error('💥 Batch migration failed:', error.message)
//       throw error
//     }
//   }

//   /**
//    * Resume from a specific product (useful for interrupted migrations)
//    */
//   async resume(filePath: string, lastProcessedId: number, overwriteCategories: boolean = false): Promise<void> {
//     const allIds = this.readProductIdsFromFile(filePath)
//     const startIndex = allIds.indexOf(lastProcessedId) + 1
    
//     if (startIndex === 0) {
//       console.error(`❌ Product ID ${lastProcessedId} not found in file`)
//       return
//     }

//     console.log(`🔄 Resuming from product ID ${lastProcessedId} (index ${startIndex})`)
//     await this.runBatch(filePath, overwriteCategories, startIndex)
//   }
// }

// // Main execution
// async function main(): Promise<void> {
//   const action = process.argv[2] || 'help'
//   const filePath = process.argv[3]
//   const overwriteCategories = process.argv.includes('--overwrite-categories')
//   const startFrom = parseInt(process.argv.find(arg => arg.startsWith('--start='))?.split('=')[1] || '0')
//   const maxProducts = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '0') || undefined

//   const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
//   const logFile = `migration-results-${timestamp}.csv`
  
//   const batch = new BatchWooMigration(logFile)

//   try {
//     if (action === 'batch') {
//       if (!filePath) {
//         console.error('❌ File path required for batch action')
//         console.error('Usage: npx tsx src/scripts/batch-woo-migration.ts batch [file.xlsx] [options]')
//         process.exit(1)
//       }
      
//       await batch.runBatch(filePath, overwriteCategories, startFrom, maxProducts)

//     } else if (action === 'resume') {
//       const lastId = parseInt(process.argv[4])
//       if (!filePath || !lastId) {
//         console.error('❌ File path and last processed ID required for resume')
//         process.exit(1)
//       }
      
//       await batch.resume(filePath, lastId, overwriteCategories)

//     } else {
//       console.log('📋 Batch WooCommerce to Medusa Migration')
//       console.log('='.repeat(60))
//       console.log('Usage:')
//       console.log('  npx tsx src/scripts/batch-woo-migration.ts batch [file.xlsx] [options]')
//       console.log('  npx tsx src/scripts/batch-woo-migration.ts resume [file.xlsx] [last-id] [options]')
//       console.log('')
//       console.log('Options:')
//       console.log('  --overwrite-categories   Replace existing categories instead of adding')
//       console.log('  --start=N               Start from product at index N (0-based)')
//       console.log('  --limit=N               Process maximum N products')
//       console.log('')
//       console.log('Examples:')
//       console.log('  npx tsx src/scripts/batch-woo-migration.ts batch products.xlsx')
//       console.log('  npx tsx src/scripts/batch-woo-migration.ts batch products.xlsx --overwrite-categories')
//       console.log('  npx tsx src/scripts/batch-woo-migration.ts batch products.xlsx --start=100 --limit=50')
//       console.log('  npx tsx src/scripts/batch-woo-migration.ts resume products.xlsx 12345')
//       console.log('')
//       console.log('CSV Output Columns:')
//       console.log('  - woo_product_id: WooCommerce product ID')
//       console.log('  - woo_sku: Product SKU')
//       console.log('  - product_title: Product name') 
//       console.log('  - status: success/error/skipped')
//       console.log('  - medusa_product_id: Created Medusa product ID')
//       console.log('  - medusa_handle: Product handle/slug')
//       console.log('  - categories_assigned: Number of categories assigned')
//       console.log('  - variants_count: Number of variants created')
//       console.log('  - error_message: Error details if failed')
//       console.log('  - processed_at: Timestamp')
//       console.log('  - duration_seconds: Processing time')
//     }

//   } catch (error: any) {
//     console.error('\n💥 Script failed:', error.message)
//     process.exit(1)
//   }
// }

// export { BatchWooMigration }

// if (require.main === module) {
//   main()
// }
