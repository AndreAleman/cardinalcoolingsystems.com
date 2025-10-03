// #!/usr/bin/env node
// // backend/src/scripts/migrate-single-product.ts
// import { createClient } from '@sanity/client'
// import { JSDOM } from 'jsdom'
// import { v4 as uuid } from 'uuid'
// import dotenv from 'dotenv'
// import path from 'path'
// import axios from 'axios'

// // Load environment variables from backend root
// dotenv.config({ path: path.join(process.cwd(), '.env') })

// // Type definitions
// interface ProductMetadata {
//   parent_sku: string
//   woocommerce_id: number
//   woocommerce_description: string
//   woocommerce_images_count: number
//   woocommerce_images_downloaded: boolean
//   woocommerce_description_updated: string
// }

// interface MedusaProduct {
//   id: string
//   title: string
//   metadata: ProductMetadata
// }

// interface SanityBlock {
//   _type: string
//   _key: string
//   [key: string]: any
// }

// // Sanity client
// const sanityClient = createClient({
//   projectId: process.env.SANITY_PROJECT_ID!,
//   dataset: process.env.SANITY_DATASET || 'production',
//   useCdn: false,
//   token: process.env.SANITY_API_TOKEN!,
//   apiVersion: '2023-05-03'
// })

// // Medusa client for fetching product data
// const medusaClient = axios.create({
//   baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
//   headers: {
//     'Content-Type': 'application/json'
//   }
// })

// class ProductMigrator {
//   private authToken: string | null = null

//   constructor() {
//     // Check environment variables
//     if (!process.env.SANITY_PROJECT_ID) {
//       throw new Error('SANITY_PROJECT_ID is required')
//     }
//     if (!process.env.SANITY_API_TOKEN) {
//       throw new Error('SANITY_API_TOKEN is required - get a write token from Sanity')
//     }
//   }

//   /**
//    * Authenticate with Medusa
//    */
//   private async authenticate(): Promise<void> {
//     if (this.authToken) return

//     try {
//       console.log('🔐 Authenticating with Medusa...')
//       const authResponse = await medusaClient.post('/auth/user/emailpass', {
//         email: 'admin@yourmail.com',  // ← HARDCODED
//         password: 'lbd9fbfl5hgxj7jzfevy0yuagyft1fd3'  // ← HARDCODED
//       })

//       this.authToken = authResponse.data.token
//       medusaClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`
//       console.log('✅ Medusa authentication successful')
//     } catch (error: any) {
//       console.error('❌ Medusa authentication failed:', error.response?.data || error.message)
//       throw error
//     }
//   }

//   /**
//    * Fetch product from Medusa by ID
//    */
//   private async fetchProductFromMedusa(productId: string): Promise<MedusaProduct> {
//     await this.authenticate()

//     console.log('📡 Fetching product from Medusa...')
//     const response = await medusaClient.get(`/admin/products/${productId}`, {
//       params: { fields: 'id,title,metadata' }
//     })

//     const product = response.data.product
//     console.log(`✅ Product: ${product.title}`)

//     if (!product.metadata?.woocommerce_description) {
//       throw new Error('No woocommerce_description found in product metadata. Run description-to-meta script first.')
//     }

//     return {
//       id: product.id,
//       title: product.title,
//       metadata: product.metadata
//     }
//   }

//   async migrateProduct(productId: string): Promise<void> {
//     console.log(`🚀 Starting migration for product: ${productId}\n`)
//     console.log(`📋 Using Sanity Project: ${process.env.SANITY_PROJECT_ID}`)
//     console.log(`📋 Using Dataset: ${process.env.SANITY_DATASET || 'production'}\n`)

//     try {
//       // Fetch product from Medusa instead of hardcoded data
//       const product = await this.fetchProductFromMedusa(productId)
//       await this.processProduct(product)
//       console.log('\n✅ Migration completed successfully!')
//     } catch (error) {
//       console.error('\n❌ Migration failed:', error)
//       process.exit(1)
//     }
//   }

//   private async processProduct(product: MedusaProduct): Promise<void> {
//     console.log(`📦 Processing: ${product.title} (${product.id})`)

//     const htmlDescription = product.metadata.woocommerce_description
//     if (!htmlDescription) {
//       console.log('   ❌ No HTML description found')
//       return
//     }

//     console.log(`   📝 HTML length: ${htmlDescription.length} characters`)

//     // Convert HTML to PortableText using direct parsing
//     console.log('   🔄 Converting HTML to PortableText...')
//     const descriptionBlocks = await this.parseHTMLDirectly(htmlDescription)

//     console.log(`   📊 Generated ${descriptionBlocks.length} blocks:`)
//     descriptionBlocks.forEach((block, i) => {
//       console.log(`      ${i + 1}. ${block._type} ${block._type === 'productTable' ? `(${(block as any).rows?.length || 0} rows)` : ''}`)
//     })

//     // Save to Sanity
//     console.log('   💾 Saving to Sanity...')
//     await this.saveToSanity(product, descriptionBlocks)

//     console.log('   ✅ Success!')
//   }

//   private async parseHTMLDirectly(html: string): Promise<SanityBlock[]> {
//     const blocks: SanityBlock[] = []
    
//     // Clean up the HTML first
//     let cleaned = html
//       .replace(/<p>\s*<\/p>/g, '') // Remove empty paragraphs
//       .replace(/<p>\s*n\s*<\/p>/g, '') // Remove 'n' paragraphs  
//       .replace(/\s+/g, ' ') // Normalize whitespace
//       .trim()

//     console.log('   🧹 Cleaned HTML length:', cleaned.length)

//     const dom = new JSDOM(cleaned)
//     const document = dom.window.document

//     // Extract images
//     const images = document.querySelectorAll('img')
//     images.forEach(img => {
//       const src = img.getAttribute('src')
//       if (src) {
//         blocks.push({
//           _type: 'image',
//           _key: uuid(),
//           url: src,
//           alt: img.getAttribute('alt') || '',
//         })
//         console.log(`   📸 Found image: ${src}`)
//       }
//     })

//     // Extract tables
//     const tables = document.querySelectorAll('table')
//     tables.forEach(table => {
//       const rows: Array<{cells: Array<{text: string; colspan?: number; rowspan?: number}>}> = []
//       const trNodes = table.querySelectorAll('tr')
      
//       trNodes.forEach(tr => {
//         const cells = Array.from(tr.querySelectorAll('th, td')).map(cell => {
//           const colspan = parseInt(cell.getAttribute('colspan') || '1', 10)
//           const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10)
          
//           const entry: {text: string; colspan?: number; rowspan?: number} = {
//             text: (cell.textContent || '').replace(/\s+/g, ' ').trim(),
//           }
          
//           if (colspan > 1) entry.colspan = colspan
//           if (rowspan > 1) entry.rowspan = rowspan
          
//           return entry
//         })
        
//         if (cells.length > 0) {
//           rows.push({cells})
//         }
//       })

//       if (rows.length > 0) {
//         blocks.push({
//           _type: 'productTable',
//           _key: uuid(),
//           rows,
//         })
//         console.log(`   📊 Found table with ${rows.length} rows`)
//       }
//     })

//     // Extract text content (look for strong tags and paragraph content)
//     const textContent = document.body.textContent || ''
//     const notesMatch = textContent.match(/Notes:(.+)/i)
    
//     if (notesMatch) {
//       const notesText = notesMatch[1].trim()
//       blocks.push({
//         _type: 'block',
//         _key: uuid(),
//         style: 'normal',
//         markDefs: [],
//         children: [
//           {
//             _type: 'span',
//             _key: uuid(),
//             text: 'Notes: ' + notesText,
//             marks: []
//           }
//         ]
//       })
//       console.log(`   📝 Found notes section: ${notesText.substring(0, 50)}...`)
//     }

//     return blocks
//   }

//   private async saveToSanity(product: MedusaProduct, descriptionBlocks: SanityBlock[]): Promise<void> {
//     const sanityDoc = {
//       _id: product.id,
//       _type: 'product',
//       title: product.title,
//       description: descriptionBlocks,
//       specs: [{
//         _key: product.id,
//         _type: 'spec',
//         lang: 'en',
//         title: product.title
//       }]
//     }

//     console.log('   📤 Uploading to Sanity...')
//     await sanityClient.createOrReplace(sanityDoc)
//   }
// }

// // CLI Interface
// async function main() {
//   const args = process.argv.slice(2)
  
//   if (args.length === 0) {
//     console.log('Usage: npx tsx src/scripts/migrate-single-product.ts <product-id>')
//     console.log('Example: npx tsx src/scripts/migrate-single-product.ts prod_01K2ZKH2JYFJA45A1X744VD0FE')
//     process.exit(1)
//   }

//   const productId = args[0]
//   const migrator = new ProductMigrator()
//   await migrator.migrateProduct(productId)
// }

// // Run if this file is executed directly
// if (require.main === module) {
//   main()
// }
