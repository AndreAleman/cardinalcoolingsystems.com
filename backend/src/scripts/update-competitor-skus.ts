// src/scripts/update-competitor-skus.ts
import 'dotenv/config'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parse/sync'

interface CompetitorSKURow {
  'Our Sku': string
  'sanitaryfittings-sku': string
  'ferguson-sku': string
}

class CompetitorSKUUpdater {
  private medusaClient: axios.AxiosInstance
  private authToken: string | null = null
  
  constructor() {
    this.medusaClient = axios.create({
      baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 120000  // ✅ Increase to 2 minutes (from 60 seconds)
    })
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
      console.error('Authentication error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw new Error(`Medusa authentication failed: ${error.response?.data?.message || error.message}`)
    }
  }

  async getAllMedusaVariants(): Promise<Map<string, { productId: string; variantId: string }>> {
    try {
      await this.authenticateWithMedusa()
      const variantMap = new Map<string, { productId: string; variantId: string }>()
      let offset = 0
      const limit = 100
      let hasMore = true

      console.log('📥 Fetching all Medusa product variants...')

      while (hasMore) {
        const response = await this.medusaClient.get('/admin/products', {
          params: {
            limit,
            offset,
            fields: 'id,*variants'
          }
        })

        const products = response.data.products
        
        for (const product of products) {
          if (product.variants) {
            for (const variant of product.variants) {
              if (variant.sku) {
                variantMap.set(variant.sku, {
                  productId: product.id,
                  variantId: variant.id
                })
              }
            }
          }
        }

        console.log(`   Fetched ${variantMap.size} total variants...`)

        if (products.length < limit) {
          hasMore = false
        } else {
          offset += limit
        }
      }

      console.log(`✅ Total variants indexed: ${variantMap.size}\n`)
      return variantMap
    } catch (error: any) {
      console.error('❌ Failed to fetch Medusa variants:', error.message)
      throw error
    }
  }

  parseCSV(filePath: string): Map<string, string[]> {
    console.log(`📄 Reading CSV file: ${filePath}`)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      trim: true
    }) as CompetitorSKURow[]

    console.log(`✅ Parsed ${records.length} rows from CSV\n`)

    const skuMap = new Map<string, string[]>()
    
    for (const row of records) {
      const ourSku = row['Our Sku']?.trim()
      const sanitarySku = row['sanitaryfittings-sku']?.trim()
      const fergusonSku = row['ferguson-sku']?.trim()

      if (!ourSku) continue

      const competitorSkus: string[] = []
      if (sanitarySku) competitorSkus.push(sanitarySku)
      if (fergusonSku) competitorSkus.push(fergusonSku)

      if (competitorSkus.length > 0) {
        if (skuMap.has(ourSku)) {
          const existing = skuMap.get(ourSku)!
          skuMap.set(ourSku, [...new Set([...existing, ...competitorSkus])])
        } else {
          skuMap.set(ourSku, competitorSkus)
        }
      }
    }

    console.log(`📊 Unique SKU mappings: ${skuMap.size}\n`)
    return skuMap
  }

  async updateVariantMetadata(
    productId: string,
    variantId: string,
    competitorSkus: string[]
  ): Promise<void> {
    try {
      await this.medusaClient.post(`/admin/products/${productId}/variants/${variantId}`, {
        metadata: {
          competitor_skus: competitorSkus
        }
      })
    } catch (error: any) {
      // ✅ ENHANCED ERROR LOGGING
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.response?.data?.message || error.message,
        type: error.response?.data?.type,
        data: error.response?.data
      }
      throw new Error(`Status ${errorDetails.status}: ${errorDetails.message || 'Unknown error'} - ${JSON.stringify(errorDetails.data || {})}`)
    }
  }

  async debugSKUs(csvPath: string): Promise<void> {
    try {
      console.log('🔍 DEBUG MODE: Comparing CSV SKUs vs Medusa SKUs')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      const skuMap = this.parseCSV(csvPath)
      const variantMap = await this.getAllMedusaVariants()

      console.log('📋 Sample SKUs from CSV (first 10):')
      let count = 0
      for (const [sku] of skuMap.entries()) {
        if (count++ >= 10) break
        console.log(`   ${sku}`)
      }

      console.log('\n📦 Sample SKUs from Medusa (first 10):')
      count = 0
      for (const [sku] of variantMap.entries()) {
        if (count++ >= 10) break
        console.log(`   ${sku}`)
      }

      console.log('\n🔗 Matches found:')
      let matchCount = 0
      for (const [csvSku] of skuMap.entries()) {
        if (variantMap.has(csvSku)) {
          matchCount++
          if (matchCount <= 5) {
            console.log(`   ✅ ${csvSku}`)
          }
        }
      }
      console.log(`\n   Total matches: ${matchCount}/${skuMap.size}`)

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    } catch (error: any) {
      console.error('\n❌ Debug failed:', error.message)
      throw error
    }
  }

async updateAllCompetitorSKUs(csvPath: string): Promise<void> {
  try {
    console.log('🚀 Competitor SKU Metadata Update')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const skuMap = this.parseCSV(csvPath)
    const variantMap = await this.getAllMedusaVariants()

    let successCount = 0
    let skippedCount = 0
    let errorCount = 0
    let totalProcessed = 0
    const errorLog: string[] = []

    console.log('🔄 Updating variant metadata...\n')

    for (const [ourSku, competitorSkus] of skuMap.entries()) {
      totalProcessed++

      const variantInfo = variantMap.get(ourSku)
      
      if (!variantInfo) {
        if (skippedCount < 5) {
          console.log(`   [${totalProcessed}/${skuMap.size}] ${ourSku}`)
          console.log(`      ⚠️ Not found in Medusa - SKIPPED\n`)
        }
        skippedCount++
        continue
      }

      console.log(`   [${totalProcessed}/${skuMap.size}] ${ourSku}`)

      // ✅ RETRY LOGIC: Try up to 3 times
      let attempts = 0
      let success = false
      
      while (attempts < 3 && !success) {
        try {
          await this.updateVariantMetadata(
            variantInfo.productId,
            variantInfo.variantId,
            competitorSkus
          )
          
          console.log(`      ✅ Updated metadata: ${competitorSkus.join(' | ')}`)
          console.log(`      📦 Product: ${variantInfo.productId}\n`)
          successCount++
          success = true

        } catch (error: any) {
          attempts++
          if (attempts < 3) {
            console.log(`      ⚠️ Attempt ${attempts} failed, retrying...`)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts)) // Exponential backoff
          } else {
            console.error(`      ❌ ERROR after 3 attempts: ${error.message}\n`)
            errorLog.push(`${ourSku}: ${error.message}`)
            errorCount++
          }
        }
      }

      // ✅ SLOWER RATE: 300ms delay between requests (instead of 100ms)
      if (success) {
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (skippedCount > 5) {
      console.log(`   ... and ${skippedCount - 5} more skipped\n`)
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎉 COMPETITOR SKU UPDATE COMPLETE!')
    console.log(`   ✅ Success: ${successCount}`)
    console.log(`   ⚠️ Skipped: ${skippedCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log(`   📊 Total: ${totalProcessed}`)
    
    if (errorLog.length > 0) {
      console.log('\n📋 ERROR DETAILS (first 10):')
      errorLog.slice(0, 10).forEach(err => console.log(`   ${err}`))
      
      const errorFile = path.join(process.cwd(), 'competitor-sku-errors.log')
      fs.writeFileSync(errorFile, errorLog.join('\n'))
      console.log(`\n💾 Full error log saved to: ${errorFile}`)
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } catch (error: any) {
    console.error('\n❌ Update failed:', error.message)
    throw error
  }
}

}

async function main(): Promise<void> {
  const command = process.argv[2]
  const csvPath = process.argv[3] || path.join(process.cwd(), 'matching-skus.csv')

  console.log('\n🚀 Competitor SKU Metadata Updater\n')

  const updater = new CompetitorSKUUpdater()

  try {
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`)
      console.log('\nUsage:')
      console.log('  Update SKUs:  npx tsx src/scripts/update-competitor-skus.ts update')
      console.log('  Debug:        npx tsx src/scripts/update-competitor-skus.ts debug')
      console.log('  Custom CSV:   npx tsx src/scripts/update-competitor-skus.ts update path/to/file.csv')
      process.exit(1)
    }

    if (command === 'debug') {
      await updater.debugSKUs(csvPath)
    } else {
      await updater.updateAllCompetitorSKUs(csvPath)
    }
  } catch (error: any) {
    console.error('💥 Operation failed:', error.message)
    process.exit(1)
  }
}

export { CompetitorSKUUpdater }

if (require.main === module) {
  main()
}
