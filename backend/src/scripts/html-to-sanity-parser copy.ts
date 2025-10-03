// import 'dotenv/config'
// import axios from 'axios'
// import { createClient } from '@sanity/client'
// import * as cheerio from 'cheerio';
// import readline from 'readline'

// interface ParsedComponents {
//   images: Array<{
//     src?: string
//     alt?: string
//     title?: string
//     width?: string
//     height?: string
//     style?: string
//   }>
//   tables: Array<{
//     headers: Array<{
//       text: string
//       colspan: string
//       rowspan: string
//     }>
//     rows: Array<Array<{
//       text: string
//       colspan: string
//       rowspan: string
//     }>>
//     attributes: {
//       style?: string
//       border?: string
//     }
//   }>
//   textBlocks: Array<{
//     text: string
//     html?: string
//   }>
// }

// class HTMLToSanityParser {
//   private medusaClient: axios.AxiosInstance
//   private sanityClient: any
//   private authToken: string | null = null
//   private imageCache = new Map<string, string>()
//   private uploadLimit: any = null

//   constructor() {
//     // Initialize Medusa client
//     this.medusaClient = axios.create({
//       baseURL: process.env.MEDUSA_API_URL || 'http://localhost:9000',
//       headers: {
//         'Content-Type': 'application/json'
//       }
//     })

//     // Initialize Sanity client
//     this.sanityClient = createClient({
//       projectId: process.env.SANITY_PROJECT_ID!,
//       dataset: process.env.SANITY_DATASET!,
//       token: process.env.SANITY_API_TOKEN!,
//       useCdn: false,
//       apiVersion: '2023-05-03'
//     })
//   }

//   private async getUploadLimit() {
//     if (!this.uploadLimit) {
//       const pLimit = await import('p-limit')
//       this.uploadLimit = pLimit.default(5)
//     }
//     return this.uploadLimit
//   }

//   /**
//    * STEP 1: Test Medusa API connection
//    */
//   async testMedusaConnection(): Promise<void> {
//     try {
//       console.log('🔐 Testing Medusa authentication...')
      
//       // Authenticate with Medusa
//       const authResponse = await this.medusaClient.post('/auth/user/emailpass', {
//         email: process.env.MEDUSA_ADMIN_EMAIL,
//         password: process.env.MEDUSA_ADMIN_PASSWORD
//       })

//       this.authToken = authResponse.data.token
//       this.medusaClient.defaults.headers['Authorization'] = `Bearer ${this.authToken}`
      
//       console.log('✅ Medusa authentication successful')

//       // Test: Fetch one product
//       console.log('📡 Testing product retrieval...')
//       const response = await this.medusaClient.get('/admin/products', {
//         params: { limit: 1, fields: 'id,title,description' }
//       })

//       const testProduct = response.data.products[0]
//       console.log('✅ Product retrieval successful:')
//       console.log(`  • ID: ${testProduct.id}`)
//       console.log(`  • Title: ${testProduct.title}`)
//       console.log(`  • Has description: ${testProduct.description ? 'Yes' : 'No'}`)
      
//       if (testProduct.description) {
//         console.log(`  • Description length: ${testProduct.description.length} characters`)
//         console.log(`  • Description preview: ${testProduct.description.substring(0, 100)}...`)
//       }

//     } catch (error: any) {
//       console.error('❌ Medusa connection failed:', error.response?.data || error.message)
//       throw error
//     }
//   }

//   /**
//    * STEP 1: Test Sanity API connection
//    */
//   async testSanityConnection(): Promise<void> {
//     try {
//       console.log('🔐 Testing Sanity connection...')
      
//       // Test: Query existing products
//       const query = '*[_type == "product"] | order(_createdAt desc) [0...5] { _id, title, tabs }'
//       const products = await this.sanityClient.fetch(query)
      
//       console.log('✅ Sanity connection successful')
//       console.log(`📋 Found ${products.length} existing products in Sanity:`)
      
//       products.forEach((product: any) => {
//         console.log(`  • ${product._id}: ${product.title}`)
//         console.log(`    - Tabs: ${product.tabs?.length || 0} tabs`)
//       })

//       // Test: Try to fetch a specific product by Medusa ID format
//       if (products.length > 0) {
//         const firstProduct = products[0]
//         console.log(`🔍 Testing specific product query for: ${firstProduct._id}`)
        
//         const specificProduct = await this.sanityClient.getDocument(firstProduct._id)
//         console.log('✅ Specific product query successful')
//         console.log(`  • Found: ${specificProduct.title}`)
//       }

//     } catch (error: any) {
//       console.error('❌ Sanity connection failed:', error.message)
//       throw error
//     }
//   }

//   /**
//    * STEP 1: Run all connection tests
//    */
//   async runConnectionTests(): Promise<void> {
//     console.log('🚀 Starting connection tests...\n')
    
//     try {
//       await this.testMedusaConnection()
//       console.log('')
//       await this.testSanityConnection()
      
//       console.log('\n🎉 All connection tests passed!')
//       console.log('Ready to proceed to Step 2: HTML Extraction & Cleaning')
      
//     } catch (error) {
//       console.error('\n💥 Connection tests failed. Please fix the issues above before proceeding.')
//       process.exit(1)
//     }
//   }

//   /**
//    * STEP 2: Test HTML extraction and cleaning
//    */
//   async testHTMLExtraction(productId: string): Promise<void> {
//     try {
//       console.log(`🔍 STEP 2: Testing HTML extraction for product ${productId}`)
      
//       // Fetch the specific product with full description
//       console.log('📡 Fetching product description...')
//       const response = await this.medusaClient.get(`/admin/products/${productId}`, {
//         params: { fields: 'id,title,description' }
//       })
      
//       const product = response.data.product
//       console.log(`✅ Product fetched: ${product.title}`)
      
//       if (!product.description) {
//         console.log('⚠️ No description found for this product')
//         return
//       }
      
//       console.log(`📋 Description length: ${product.description.length} characters`)
      
//       // Show raw HTML
//       console.log('\n🔍 RAW HTML DESCRIPTION:')
//       console.log('=' .repeat(80))
//       console.log(product.description)
//       console.log('=' .repeat(80))
      
//       // Clean the HTML
//       console.log('\n🧹 Cleaning HTML...')
//       const cleanedHTML = this.cleanHTML(product.description)
      
//       console.log('\n✨ CLEANED HTML DESCRIPTION:')
//       console.log('=' .repeat(80))
//       console.log(cleanedHTML)
//       console.log('=' .repeat(80))
      
//       console.log(`\n📊 Cleaning results:`)
//       console.log(`  • Original length: ${product.description.length} characters`)
//       console.log(`  • Cleaned length: ${cleanedHTML.length} characters`)
//       console.log(`  • Characters removed: ${product.description.length - cleanedHTML.length}`)
      
//     } catch (error: any) {
//       console.error('❌ HTML extraction failed:', error.response?.data || error.message)
//       throw error
//     }
//   }

//   /**
//    * ✅ ENHANCED HTML CLEANING - Fix 1
//    */
//   cleanHTML(html: string): string {
//     let cleaned = html

//     // ✅ Fix 1: Remove 'n' artifacts specifically
//     cleaned = cleaned.replace(/\s+n\s+/g, ' ')           // Remove 'n' between spaces
//     cleaned = cleaned.replace(/\bn\s*/g, '')             // Remove 'n' at word boundaries
//     cleaned = cleaned.replace(/\s*n\b/g, '')             // Remove 'n' at end of words
//     cleaned = cleaned.replace(/<br\s*\/?\s*>\s*n/g, ' ') // Remove 'n' after line breaks
//     cleaned = cleaned.replace(/n\(/g, '(')               // Fix "n(" patterns
    
//     // ✅ Existing cleaning (keep these)
//     cleaned = cleaned.replace(/<p>\s*n\s*<\/p>/g, '')    // Remove standalone 'n' paragraphs  
//     cleaned = cleaned.replace(/&nbsp;/g, ' ')             // Remove non-breaking spaces
//     cleaned = cleaned.replace(/\s+/g, ' ')               // Normalize whitespace
//     cleaned = cleaned.trim()                             // Remove empty paragraph tags
//     cleaned = cleaned.replace(/<p>\s*<\/p>/g, '')

//     return cleaned
//   }

//   /**
//    * STEP 2: Run HTML extraction test
//    */
//   async runStep2(productId: string): Promise<void> {
//     console.log('🚀 Starting Step 2: HTML Extraction & Cleaning\n')
    
//     try {
//       // First ensure we're authenticated
//       if (!this.authToken) {
//         await this.testMedusaConnection()
//         console.log('')
//       }
      
//       await this.testHTMLExtraction(productId)
      
//       console.log('\n🎉 Step 2 completed successfully!')
//       console.log('Ready to proceed to Step 3: Basic HTML Parsing')
      
//     } catch (error) {
//       console.error('\n💥 Step 2 failed. Please fix the issues above before proceeding.')
//       throw error
//     }
//   }

//   /**
//    * STEP 3: Basic HTML parsing into components
//    */
//   async testHTMLParsing(productId: string): Promise<void> {
//     try {
//       console.log(`🔍 STEP 3: Testing HTML parsing for product ${productId}`)
      
//       // Get the HTML (reuse from Step 2)
//       if (!this.authToken) {
//         await this.testMedusaConnection()
//       }
      
//       const response = await this.medusaClient.get(`/admin/products/${productId}`, {
//         params: { fields: 'id,title,description' }
//       })
      
//       const product = response.data.product
//       console.log(`✅ Product: ${product.title}`)
      
//       if (!product.description) {
//         console.log('⚠️ No description found')
//         return
//       }
      
//       const cleanedHTML = this.cleanHTML(product.description)
//       console.log(`📋 Parsing ${cleanedHTML.length} characters of HTML...\n`)
      
//       // Parse HTML into components
//       const components = this.parseHTMLComponents(cleanedHTML)
      
//       // Display results
//       this.displayParsedComponents(components)
      
//     } catch (error: any) {
//       console.error('❌ HTML parsing failed:', error.response?.data || error.message)
//       throw error
//     }
//   }

//   /**
//    * ✅ ENHANCED HTML PARSING - Fix 2
//    */
//   private parseHTMLComponents(html: string): ParsedComponents {
//     const $ = cheerio.load(html)  // This will now work properly
    
//     const components: ParsedComponents = {
//       images: [],
//       tables: [],
//       textBlocks: []
//     }
    
//     // Extract images
//     $('img').each((index: number, element: any) => {
//       const $img = $(element)
//       components.images.push({
//         src: $img.attr('src'),
//         alt: $img.attr('alt'),
//         title: $img.attr('title'),
//         width: $img.attr('width'),
//         height: $img.attr('height'),
//         style: $img.attr('style')
//       })
//     })
    
//     // ✅ Fix 2: Enhanced table parsing
// // ✅ Fix 2: Enhanced table parsing
// $('table').each((index: number, element: any) => {
//   const $table = $(element)
//   const tableData = this.parseComplexTable($table, $) // ← Pass '$' as second parameter
  
//   if (tableData.headers.length > 0) {
//     components.tables.push(tableData)
//   }
// })
    
//     // Extract text blocks (paragraphs that aren't empty and don't contain images/tables)
//     $('p').each((index: number, element: any) => {
//       const $p = $(element)
//       const text = $p.text().trim()
      
//       // Skip empty paragraphs and those containing images
//       if (text && !$p.find('img').length) {
//         // Get HTML content to preserve formatting like <strong>, <br>
//         const htmlContent = $p.html()
//         components.textBlocks.push({
//           text: text,
//           html: htmlContent
//         })
//       }
//     })
    
//     return components
//   }

//   /**
//    * ✅ ENHANCED TABLE PARSER - Fix 2 continuation
//    */
// /**
//  * ✅ ENHANCED TABLE PARSER - Fix 2 continuation
//  */
// private parseComplexTable($table: any, $: any): any {  // ← Add '$: any' parameter
//   const rows = []
  
//   // Get all rows
//   $table.find('tr').each((i, row) => {
//     const cells = []
//     $(row).find('td, th').each((j, cell) => {
//       const $cell = $(cell)
//       cells.push({
//         text: $cell.text().trim(),
//         colspan: parseInt($cell.attr('colspan') || '1'),
//         rowspan: parseInt($cell.attr('rowspan') || '1'),
//         isHeader: $cell.is('th')
//       })
//     })
//     if (cells.length > 0) {
//       rows.push(cells)
//     }
//   })

//   // ✅ Fix 3: Handle your specific table structure
//   if (rows.length >= 2 && this.isYourTableStructure(rows)) {
//     return this.parseYourTableStructure(rows)
//   }

//   // Fallback to simple parsing
//   return {
//     headers: rows[0]?.map(cell => ({ text: cell.text, colspan: '1', rowspan: '1' })) || [],
//     rows: rows.slice(1).map(row => row.map(cell => ({ text: cell.text, colspan: '1', rowspan: '1' }))),
//     attributes: {}
//   }
// }


//   /**
//    * ✅ TABLE STRUCTURE DETECTION - Fix 2 continuation
//    */
// private isYourTableStructure(rows: any[]): boolean {
//   if (rows.length < 2) {
//     console.log('❌ Not enough rows:', rows.length)
//     return false
//   }
  
//   const firstRow = rows[0]
//   const secondRow = rows[1]
  
//   console.log('🔍 DEBUG - First row:', firstRow.map(cell => `"${cell.text}" (colspan:${cell.colspan})`))
//   console.log('🔍 DEBUG - Second row:', secondRow.map(cell => `"${cell.text}"`))
  
//   // Check for multi-colspan structure (any column with colspan > 1)
//   const hasMultiColspan = firstRow.some((cell: any) => cell.colspan > 1)
  
//   // Check if second row has content (indicating sub-headers)
//   const hasSubHeaders = secondRow.length > 0 && 
//                        secondRow.some((cell: any) => cell.text.trim() !== '')
  
//   // Check if we have more columns in data rows than in first row
//   // (indicating that some columns are split)
//   const hasColumnExpansion = rows.length > 2 && rows[2] && 
//                              rows[2].length > firstRow.length
  
//   // Check for specific patterns we know about
//   const isKnownPattern = (
//     // Pattern 1: Size + Part Number + Dimensions with A/B
//     (firstRow.length >= 3 && 
//      firstRow[0].text.includes('Size') &&
//      firstRow[1].text.includes('Part') &&
//      firstRow[2].text.includes('Dimensions')) ||
    
//     // Pattern 2: Any table with Size(Tube OD) and multi-colspan
//     (firstRow.some((cell: any) => cell.text.includes('Size')) && hasMultiColspan)
//   )
  
//   console.log('🔍 DEBUG - Has multi-colspan:', hasMultiColspan)
//   console.log('🔍 DEBUG - Has sub-headers:', hasSubHeaders)
//   console.log('🔍 DEBUG - Has column expansion:', hasColumnExpansion)
//   console.log('🔍 DEBUG - Is known pattern:', isKnownPattern)
  
//   // Match if we have indicators of a complex table structure
//   const isMatch = isKnownPattern && (hasMultiColspan || hasSubHeaders || hasColumnExpansion)
         
//   console.log('🔍 DEBUG - Structure match:', isMatch)
//   return isMatch
// }


//   /**
//    * ✅ STRUCTURE PARSER - Enhanced for complex multi-colspan structures
//    */
//   private parseYourTableStructure(rows: any[]): any {
//     const firstRow = rows[0]
//     const secondRow = rows[1]
    
//     console.log('🔧 FIXING: Creating proper table structure with dynamic column positioning...')
    
//     // Enhance colspan values based on actual structure
//     this.enhanceColspanValues(firstRow, secondRow, rows)
    
//     // Calculate the total number of columns based on enhanced first row colspans
//     let totalColumns = 0
//     firstRow.forEach((cell: any) => {
//       totalColumns += cell.colspan
//     })
    
//     console.log(`📊 Total columns calculated: ${totalColumns}`)
    
//     // Create the first header row (preserve original colspan values)
//     const headerRow1 = firstRow.map((cell: any) => ({
//       text: cell.text.replace(/\bn\s*/g, '').trim(),
//       colspan: cell.colspan.toString(),
//       rowspan: cell.rowspan ? cell.rowspan.toString() : '1'
//     }))
    
//     // Create the second header row with proper positioning
//     const headerRow2 = this.createPositionedRow(firstRow, secondRow, totalColumns)
    
//     // Process data rows (skip first two header rows)
//     const dataRows = rows.slice(2).map(row => {
//       // Ensure we have the correct number of columns for each data row
//       const processedRow = []
      
//       for (let i = 0; i < totalColumns; i++) {
//         if (row[i]) {
//           processedRow.push({ text: row[i].text.trim(), colspan: '1', rowspan: '1' })
//         } else {
//           processedRow.push({ text: '', colspan: '1', rowspan: '1' })
//         }
//       }
      
//       return processedRow
//     })
    
//     // Return the structure with both header rows
//     return {
//       headers: [headerRow1, headerRow2],  // Two header rows
//       rows: dataRows,
//       attributes: {}
//     }
//   }

//   /**
//    * Enhance colspan values based on actual table structure
//    */
//   private enhanceColspanValues(firstRow: any[], secondRow: any[], allRows: any[]): void {
//     console.log('🔧 Enhancing colspan values based on structure...')
    
//     // Count non-empty cells in second row to understand the actual structure
//     const secondRowCells = secondRow.filter((cell: any) => cell.text.trim() !== '')
//     console.log(`Second row has ${secondRowCells.length} non-empty cells`)
    
//     // If we have data rows, use them to determine the actual column count
//     const dataRowLength = allRows.length > 2 ? allRows[2].length : 0
//     console.log(`Data rows have ${dataRowLength} columns`)
    
//     // Enhance colspan values for each column in first row
//     firstRow.forEach((cell: any, index: number) => {
//       const originalColspan = cell.colspan
      
//       // Special handling for known patterns
//       if (cell.text.includes('Size') && dataRowLength > 0) {
//         // Size column: check if it spans multiple columns in data
//         const sizeColspan = this.calculateSizeColspan(allRows)
//         if (sizeColspan > 1) {
//           cell.colspan = sizeColspan
//           console.log(`Enhanced Size colspan: ${originalColspan} → ${sizeColspan}`)
//         }
//       } else if (cell.text.includes('Part') && originalColspan === 1) {
//         // Part Number: check if we have sub-headers like 304, 316L
//         const partColspan = this.calculatePartNumberColspan(secondRow, index)
//         if (partColspan > 1) {
//           cell.colspan = partColspan
//           console.log(`Enhanced Part Number colspan: ${originalColspan} → ${partColspan}`)
//         }
//       } else if (cell.text.includes('Dimensions') && originalColspan === 1) {
//         // Dimensions: check if we have sub-headers like A, B, C, D
//         const dimensionsColspan = this.calculateDimensionsColspan(secondRow, firstRow, index)
//         if (dimensionsColspan > 1) {
//           cell.colspan = dimensionsColspan
//           console.log(`Enhanced Dimensions colspan: ${originalColspan} → ${dimensionsColspan}`)
//         }
//       }
//     })
//   }

//   /**
//    * Calculate Size column colspan based on data structure
//    */
//   private calculateSizeColspan(allRows: any[]): number {
//     // Look at data rows to see how many columns the size takes
//     if (allRows.length > 2) {
//       const dataRow = allRows[2]
//       // Count consecutive non-empty cells that likely belong to size
//       let sizeColumns = 1
//       for (let i = 1; i < Math.min(3, dataRow.length); i++) {
//         if (dataRow[i].text.trim() === '' || dataRow[i].text.trim() === '--') {
//           sizeColumns++
//         } else {
//           break
//         }
//       }
//       return sizeColumns
//     }
//     return 1
//   }

//   /**
//    * Calculate Part Number colspan based on sub-headers
//    */
//   private calculatePartNumberColspan(secondRow: any[], partIndex: number): number {
//     // Count sub-headers that look like part number types (304, 316L, etc.)
//     let partColumns = 0
//     for (const cell of secondRow) {
//       const text = cell.text.trim()
//       if (text.match(/^\d+[A-Z]*$/)) { // Pattern like 304, 316L
//         partColumns++
//       }
//     }
//     return partColumns > 0 ? partColumns : 1
//   }

//   /**
//    * Calculate Dimensions colspan based on sub-headers
//    */
//   private calculateDimensionsColspan(secondRow: any[], firstRow: any[], dimensionsIndex: number): number {
//     // Count sub-headers that look like dimension labels (A, B, C, D, etc.)
//     let dimensionColumns = 0
//     for (const cell of secondRow) {
//       const text = cell.text.trim()
//       if (text.match(/^[A-Z]$/)) { // Single letter pattern like A, B, C, D
//         dimensionColumns++
//       }
//     }
//     return dimensionColumns > 0 ? dimensionColumns : 1
//   }

//   /**
//    * Create a positioned row based on colspan values from the parent row
//    */
//   private createPositionedRow(parentRow: any[], childCells: any[], totalColumns: number): any[] {
//     const positionedRow = []
//     let childIndex = 0
//     let currentColumn = 0
    
//     console.log('🎯 Positioning child cells...')
//     console.log(`Parent row: ${parentRow.map(cell => `"${cell.text}" (colspan:${cell.colspan})`).join(' | ')}`)
//     console.log(`Child cells: ${childCells.map(cell => `"${cell.text}"`).join(' | ')}`)
    
//     // Go through each parent cell and determine positioning
//     parentRow.forEach((parentCell: any, parentIndex: number) => {
//       const colspan = parentCell.colspan
      
//       console.log(`Processing parent cell ${parentIndex}: "${parentCell.text}" (colspan:${colspan}) at column ${currentColumn}`)
      
//       if (colspan === 1) {
//         // Single column - add empty cell
//         positionedRow.push({ text: '', colspan: '1', rowspan: '1' })
//         console.log(`  Added empty cell at position ${positionedRow.length - 1}`)
//       } else {
//         // Multi-column - add child cells for this span
//         for (let i = 0; i < colspan; i++) {
//           if (childIndex < childCells.length) {
//             const childCell = childCells[childIndex]
//             positionedRow.push({ 
//               text: childCell.text.trim(), 
//               colspan: '1', 
//               rowspan: '1' 
//             })
//             console.log(`  Added child cell "${childCell.text}" at position ${positionedRow.length - 1}`)
//             childIndex++
//           } else {
//             positionedRow.push({ text: '', colspan: '1', rowspan: '1' })
//             console.log(`  Added empty cell (no more children) at position ${positionedRow.length - 1}`)
//           }
//         }
//       }
      
//       currentColumn += colspan
//     })
    
//     // Fill remaining columns if needed
//     while (positionedRow.length < totalColumns) {
//       positionedRow.push({ text: '', colspan: '1', rowspan: '1' })
//       console.log(`  Added padding empty cell at position ${positionedRow.length - 1}`)
//     }
    
//     console.log(`Final positioned row: ${positionedRow.map(cell => `"${cell.text}"`).join(' | ')}`)
    
//     return positionedRow
//   }

//   /**
//    * Display parsed components in a readable format
//    */
//   private displayParsedComponents(components: ParsedComponents): void {
//     console.log('🖼️  IMAGES FOUND:')
//     console.log('=' .repeat(60))
//     if (components.images.length === 0) {
//       console.log('No images found')
//     } else {
//       components.images.forEach((img, index) => {
//         console.log(`Image ${index + 1}:`)
//         console.log(`  • Source: ${img.src}`)
//         console.log(`  • Alt text: ${img.alt || 'N/A'}`)
//         console.log(`  • Title: ${img.title || 'N/A'}`)
//         console.log(`  • Dimensions: ${img.width || '?'} x ${img.height || '?'}`)
//       })
//     }
    
//     console.log('\n📊 TABLES FOUND:')
//     console.log('=' .repeat(60))
//     if (components.tables.length === 0) {
//       console.log('No tables found')
//     } else {
//       components.tables.forEach((table, index) => {
//         console.log(`Table ${index + 1}:`)
        
//         // Handle both single-row and multi-row headers
//         if (Array.isArray(table.headers[0])) {
//           // Multi-row headers (our fixed structure)
//           console.log(`  • Header structure: ${table.headers.length} header rows`)
//           table.headers.forEach((headerRow: any, headerIndex: number) => {
//             console.log(`    Header Row ${headerIndex + 1}: ${headerRow.map((h: any) => `"${h.text}"${h.colspan > 1 ? ` (colspan:${h.colspan})` : ''}`).join(' | ')}`)
//           })
//         } else {
//           // Single-row headers (fallback)
//           console.log(`  • Headers (${table.headers.length}):`, 
//             table.headers.map((h: any) => h.text).join(' | '))
//         }
        
//         console.log(`  • Data rows: ${table.rows.length}`)
        
//         // Show ALL data rows for verification
//         table.rows.forEach((row: any, rowIndex: number) => {
//           console.log(`    Row ${rowIndex + 1}: ${row.map((cell: any) => `"${cell.text}"`).join(' | ')}`)
//         })
//       })
//     }
    
//     console.log('\n📝 TEXT BLOCKS FOUND:')
//     console.log('=' .repeat(60))
//     if (components.textBlocks.length === 0) {
//       console.log('No text blocks found')
//     } else {
//       components.textBlocks.forEach((block, index) => {
//         console.log(`Text Block ${index + 1}:`)
//         console.log(`  • Content: ${block.text.substring(0, 150)}${block.text.length > 150 ? '...' : ''}`)
//         console.log(`  • HTML: ${block.html?.substring(0, 100)}${block.html && block.html.length > 100 ? '...' : ''}`)
//       })
//     }
//   }

//   /**
//    * STEP 3: Run HTML parsing test
//    */
//   async runStep3(productId: string): Promise<void> {
//     console.log('🚀 Starting Step 3: Basic HTML Parsing\n')
    
//     try {
//       await this.testHTMLParsing(productId)
      
//       console.log('\n🎉 Step 3 completed successfully!')
//       console.log('Ready to proceed to Step 4: Text-to-Portable-Text Conversion')
      
//     } catch (error) {
//       console.error('\n💥 Step 3 failed. Please fix the issues above before proceeding.')
//       throw error
//     }
//   }

//   /**
//    * STEP 4: Convert HTML components to Portable Text format
//    */
//   async testPortableTextConversion(productId: string): Promise<void> {
//     try {
//       console.log(`🔍 STEP 4: Testing Portable Text conversion for product ${productId}`)
      
//       // Get parsed components (reuse from Step 3)
//       if (!this.authToken) {
//         await this.testMedusaConnection()
//       }
      
//       const response = await this.medusaClient.get(`/admin/products/${productId}`, {
//         params: { fields: 'id,title,description' }
//       })
      
//       const product = response.data.product
//       console.log(`✅ Product: ${product.title}`)
      
//       if (!product.description) {
//         console.log('⚠️ No description found')
//         return
//       }
      
//       const cleanedHTML = this.cleanHTML(product.description)
//       const components = this.parseHTMLComponents(cleanedHTML)
      
//       console.log(`📋 Converting components to Sanity format...\n`)
      
//       // Convert to Sanity blocks
//       const sanityBlocks = await this.convertToSanityBlocks(components)
      
//       // Display results
//       this.displaySanityBlocks(sanityBlocks)
      
//     } catch (error: any) {
//       console.error('❌ Portable Text conversion failed:', error.response?.data || error.message)
//       throw error
//     }
//   }

//   /**
//    * Upload external image URL to Sanity assets
//    */
//   private async uploadImageToSanity(imageUrl: string, alt?: string): Promise<any> {
//     const uploadLimit = await this.getUploadLimit()
    
//     return uploadLimit(async () => {
//       try {
//         // Check cache first
//         if (this.imageCache.has(imageUrl)) {
//           const cachedAssetId = this.imageCache.get(imageUrl)!
//           console.log(`💾 Using cached image: ${imageUrl}`)
//           return {
//             _type: 'image',
//             asset: {
//               _type: 'reference',
//               _ref: cachedAssetId
//             },
//             alt: alt
//           }
//         }

//         console.log(`📤 Uploading image: ${imageUrl}`)
        
//         // Fetch the image from external URL
//         const response = await fetch(imageUrl)
//         if (!response.ok) {
//           throw new Error(`Failed to fetch image: ${response.statusText}`)
//         }
        
//         const imageBuffer = await response.arrayBuffer()
//         const buffer = Buffer.from(imageBuffer)
        
//         // Generate filename from URL
//         const filename = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`
        
//         // Upload to Sanity with metadata
//         const imageAsset = await this.sanityClient.assets.upload('image', buffer, {
//           filename: filename,
//           source: {
//             name: 'woocommerce-migration',
//             url: imageUrl,
//             id: imageUrl
//           }
//         })
        
//         // Cache the result
//         this.imageCache.set(imageUrl, imageAsset._id)
        
//         console.log(`✅ Image uploaded: ${imageAsset._id}`)
//         return {
//           _type: 'image',
//           asset: {
//             _type: 'reference',
//             _ref: imageAsset._id
//           },
//           alt: alt
//         }
        
//       } catch (error) {
//         console.error(`❌ Failed to upload image ${imageUrl}:`, error)
//         throw error
//       }
//     })
//   }

//   /**
//    * Convert parsed components to Sanity block format
//    */
//   private async convertToSanityBlocks(components: ParsedComponents): Promise<any[]> {
//     const sanityBlocks: any[] = []
    
//     // Step 1: Upload all images FIRST
//     console.log(`📤 Uploading ${components.images.length} images...`)
//     for (const image of components.images) {
//       if (image.src) {
//         try {
//           const imageBlock = await this.uploadImageToSanity(image.src, image.alt)
//           if (!imageBlock._key) {
//             imageBlock._key = this.generateUniqueKey()
//           }
//           sanityBlocks.push(imageBlock)
//         } catch (error) {
//           console.warn(`⚠️ Skipping image ${image.src} due to upload error:`, error)
//         }
//       }
//     }
    
//     // Step 2: Add tables with CORRECT FORMAT (simple strings in cells)
//     components.tables.forEach(table => {
//       sanityBlocks.push({
//         _type: 'table',
//         _key: this.generateUniqueKey(),
//         rows: [
//           // Header row - simple strings only
//           {
//             _type: 'tableRow',
//             _key: this.generateUniqueKey(),
//             cells: table.headers.map(header => header.text) // ← Just the text string
//           },
//           // Data rows - simple strings only  
//           ...table.rows.map(row => ({
//             _type: 'tableRow',
//             _key: this.generateUniqueKey(),
//             cells: row.map(cell => cell.text) // ← Just the text string
//           }))
//         ]
//       })
//     })
    
//     // Step 3: Add text blocks
//     components.textBlocks.forEach(textBlock => {
//       const htmlContent = textBlock.html || textBlock.text
//       const hasStrong = htmlContent.includes('<strong>')
//       const hasBr = htmlContent.includes('<br')
      
//       if (hasStrong || hasBr) {
//         const parts = this.parseSimpleHTML(htmlContent)
//         sanityBlocks.push({
//           _type: 'block',
//           _key: this.generateUniqueKey(),
//           style: 'normal',
//           children: parts.map(part => ({
//             ...part,
//             _key: part._key || this.generateUniqueKey()
//           })),
//           markDefs: []
//         })
//       } else {
//         sanityBlocks.push({
//           _type: 'block',
//           _key: this.generateUniqueKey(),
//           style: 'normal',
//           children: [{
//             _type: 'span',
//             _key: this.generateUniqueKey(),
//             text: textBlock.text,
//             marks: []
//           }],
//           markDefs: []
//         })
//       }
//     })
    
//     return sanityBlocks
//   }

//   /**
//    * Simple HTML parser for basic formatting (strong, br)
//    */
//   private parseSimpleHTML(html: string): any[] {
//     const parts: any[] = []
    
//     // Remove HTML tags but preserve the structure information
//     let text = html
//       .replace(/<br\s*\/?>/g, '\n')
//       .replace(/<strong>(.*?)<\/strong>/g, '{{STRONG_START}}$1{{STRONG_END}}')
//       .replace(/<[^>]*>/g, '') // Remove other HTML tags
    
//     // Split by formatting markers and build spans
//     const segments = text.split(/(\{\{STRONG_START\}\}|\{\{STRONG_END\}\})/g)
//     let isStrong = false
    
//     segments.forEach(segment => {
//       if (segment === '{{STRONG_START}}') {
//         isStrong = true
//       } else if (segment === '{{STRONG_END}}') {
//         isStrong = false
//       } else if (segment.trim()) {
//         parts.push({
//           _type: 'span',
//           text: segment,
//           marks: isStrong ? ['strong'] : []
//         })
//       }
//     })
    
//     return parts.length > 0 ? parts : [{
//       _type: 'span',
//       text: text,
//       marks: []
//     }]
//   }

//   /**
//    * Display Sanity blocks in readable format
//    */
//   private displaySanityBlocks(blocks: any[]): void {
//     console.log('🔄 SANITY BLOCKS CREATED:')
//     console.log('=' .repeat(70))
    
//     blocks.forEach((block, index) => {
//       console.log(`Block ${index + 1}: ${block._type}`)
      
//       switch (block._type) {
//         case 'image':
//           console.log(`  • Original source: ${block.metadata?.originalSrc}`)
//           console.log(`  • Alt text: ${block.alt || 'N/A'}`)
//           console.log(`  • Dimensions: ${block.metadata?.dimensions?.width || '?'} x ${block.metadata?.dimensions?.height || '?'}`)
//           break
          
//         case 'table':
//           console.log(`  • Rows: ${block.rows?.length || 0}`)
//           console.log(`  • Headers: ${block.rows?.[0]?.cells?.join(' | ') || 'N/A'}`)
//           if (block.rows?.length > 1) {
//             console.log(`  • Sample data: ${block.rows[1]?.cells?.join(' | ') || 'N/A'}`)
//           }
//           break
          
//         case 'block':
//           const text = block.children?.[0]?.text || 'N/A'
//           console.log(`  • Style: ${block.style || 'normal'}`)
//           console.log(`  • Text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`)
//           break
          
//         default:
//           console.log(`  • Data: ${JSON.stringify(block).substring(0, 100)}...`)
//       }
//       console.log('')
//     })
//   }

//   /**
//    * STEP 4: Run Portable Text conversion test
//    */
//   async runStep4(productId: string): Promise<void> {
//     console.log('🚀 Starting Step 4: Text-to-Portable-Text Conversion\n')
    
//     try {
//       await this.testPortableTextConversion(productId)
      
//       console.log('\n🎉 Step 4 completed successfully!')
//       console.log('Ready to proceed to Step 5: Create productTab in Sanity')
      
//     } catch (error) {
//       console.error('\n💥 Step 4 failed. Please fix the issues above before proceeding.')
//       throw error
//     }
//   }

//   /**
//    * Promisified readline question for user confirmation
//    */
//   private askQuestion(query: string): Promise<string> {
//     const rl = readline.createInterface({ 
//       input: process.stdin, 
//       output: process.stdout 
//     })
    
//     return new Promise(resolve => {
//       rl.question(query, (answer) => {
//         rl.close()
//         resolve(answer)
//       })
//     })
//   }

//   /**
//    * Delete the product description via Medusa API
//    */
//   private async clearMedusaProductDescription(productId: string): Promise<void> {
//     try {
//       console.log(`🗑️  Deleting description for product ${productId}...`)
      
//       await this.medusaClient.post(`/admin/products/${productId}`, {
//         description: '' // Clear the description
//       })
      
//       console.log('✅ Product description deleted successfully')
      
//     } catch (error: any) {
//       console.error('❌ Failed to delete product description:', error.response?.data || error.message)
//       throw error
//     }
//   }

//   /**
//    * ✅ STEP 5: Parse, publish to Sanity, verify, then clear description
//    */
//   async runStep5ParseAndClearDescription(productId: string): Promise<void> {
//     try {
//       console.log('🚀 Starting Step 5: Parse → Publish to Sanity → Verify → Clear Description\n')
      
//       // Step 1: Test Medusa connection first
//       console.log('📋 Step 1: Testing Medusa authentication...')
//       try {
//         await this.testMedusaConnection()
//         console.log('✅ Medusa authentication successful')
//       } catch (medusaError: any) {
//         console.error('❌ Medusa authentication failed:', medusaError.response?.status, medusaError.response?.data)
//         throw new Error(`Medusa auth failed: ${medusaError.message}`)
//       }

//       // Step 2: Test Sanity connection
//       console.log('📋 Step 2: Testing Sanity authentication...')
//       try {
//         const sanityTest = await this.sanityClient.fetch('*[_type == "productTab"][0]')
//         console.log('✅ Sanity authentication successful')
//       } catch (sanityError: any) {
//         console.error('❌ Sanity authentication failed:', sanityError.message)
//         throw new Error(`Sanity auth failed: ${sanityError.message}`)
//       }

//       // Step 3: Fetch and parse product content
//       console.log('📋 Step 3: Fetching and parsing product content...')
//       const response = await this.medusaClient.get(`/admin/products/${productId}`, {
//         params: { fields: 'id,title,description' }
//       })
//       const product = response.data.product
//       console.log(`✅ Product: ${product.title}`)
      
//       if (!product.description) {
//         console.log('⚠️ No description found')
//         return
//       }

//       const cleanedHTML = this.cleanHTML(product.description)
//       const components = this.parseHTMLComponents(cleanedHTML)
      
//       // Display parsed components for verification
//       this.displayParsedComponents(components)

//       // Step 4: Convert to Sanity blocks and publish directly
//       console.log('\n🔄 Step 4: Converting to Sanity format and publishing...')
//       const sanityBlocks = await this.convertToSanityBlocks(components)

//       // ✅ CREATE PUBLISHED DOCUMENT DIRECTLY (no drafts prefix)
//       const docId = `productTab-${productId.replace('prod_', '')}`
//       const sanityDocument = {
//         _type: 'productTab',
//         _id: docId, // Published immediately - no 'drafts.' prefix
//         title: `${product.title} - Product Information`,
//         medusaProductId: productId,
//         content: sanityBlocks
//       }

//       console.log('📤 Publishing content to Sanity...')
//       console.log(`📤 Document ID: ${docId}`)

//       try {
//         const sanityResult = await this.sanityClient.createOrReplace(sanityDocument)
//         console.log('✅ Content published to Sanity successfully!')
//         console.log(`   Document ID: ${sanityResult._id}`)
//       } catch (sanityCreateError: any) {
//         console.error('❌ Failed to publish to Sanity:', sanityCreateError)
//         throw sanityCreateError
//       }

//       // Step 5: Show Sanity Studio link for verification
//       const studioBaseUrl = process.env.SANITY_STUDIO_URL || 'https://your-project.sanity.studio'
//       const sanityStudioUrl = `${studioBaseUrl}/desk/productTab;${docId}`
      
//       console.log('\n🔍 CONTENT PUBLISHED TO SANITY STUDIO')
//       console.log('=' .repeat(80))
//       console.log('Your content is now live and visible in Sanity Studio!')
//       console.log('')
//       console.log(`🔗 View in Studio: ${sanityStudioUrl}`)
//       console.log('')
//       console.log('You can now see:')
//       console.log('• Complete product specification tables')
//       console.log('• Uploaded product images')
//       console.log('• Formatted text content and notes')
//       console.log('=' .repeat(80))

//       // Step 6: Wait for user verification and confirmation
//       const answer = await this.askQuestion('\n❓ Content published successfully! Ready to CLEAR the original HTML description in Medusa? (yes/no): ')

//       if (answer.toLowerCase().trim() === 'yes') {
//         // Step 7: Clear the messy HTML description in Medusa
//         console.log('\n🗑️  Clearing HTML description from Medusa...')
//         await this.clearMedusaProductDescription(productId)

//         console.log('\n🎉 Migration completed successfully!')
//         console.log('   ✅ Content published and live in Sanity')
//         console.log('   ✅ Original HTML description cleared from Medusa')
//         console.log('   ✅ Product ready for custom description')
//         console.log(`   🔗 Sanity Studio: ${sanityStudioUrl}`)

//       } else {
//         console.log('\n⏹️  Keeping original Medusa description')
//         console.log('   ✅ Content published in Sanity')
//         console.log('   • Original description preserved in Medusa')
//         console.log(`   🔗 View content: ${sanityStudioUrl}`)
//       }

//     } catch (error: any) {
//       console.error('\n💥 Step 5 failed:', error.message)
//       console.error('Full error:', error)
//       throw error
//     }
//   }

//   /**
//    * Helper: Remove all tabs from a Sanity product (for testing)
//    */
//   async removeProductTabs(productId: string): Promise<void> {
//     try {
//       console.log(`🗑️  Removing tabs from product ${productId}`)
      
//       const updatedProduct = await this.sanityClient
//         .patch(productId)
//         .set({ tabs: [] })
//         .commit()
      
//       console.log('✅ Tabs removed successfully')
      
//     } catch (error) {
//       console.error('❌ Failed to remove tabs:', error)
//       throw error
//     }
//   }

//   /**
//    * Fix existing product by adding _key to tabs that are missing it
//    */
//   async fixMissingKeys(productId: string): Promise<void> {
//     try {
//       console.log(`🔧 Fixing missing keys for product ${productId}`)
      
//       const product = await this.sanityClient.getDocument(productId)
      
//       if (product.tabs && product.tabs.length > 0) {
//         const updatedTabs = product.tabs.map((tab: any) => ({
//           ...tab,
//           _key: tab._key || this.generateUniqueKey() // Add key if missing
//         }))
        
//         await this.sanityClient
//           .patch(productId)
//           .set({ tabs: updatedTabs })
//           .commit({ autoGenerateArrayKeys: true })
        
//         console.log('✅ Keys fixed successfully')
//       }
      
//     } catch (error) {
//       console.error('❌ Failed to fix keys:', error)
//       throw error
//     }
//   }

//   /**
//    * Generate unique key for array items
//    */
//   private generateUniqueKey(): string {
//     return Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
//   }
// }

// // Test runner
// async function main() {
//   const action = process.argv[2] || 'step1'
//   const productId = process.argv[3] || 'prod_01K3PG0MVEEGC1GVBQ5BEV0FX1'
  
//   console.log(`🚀 Running HTML to Sanity Parser`)
//   console.log(`📦 Action: ${action}, Product ID: ${productId}\n`)

//   const parser = new HTMLToSanityParser()
  
//   try {
//     if (action === 'step1') {
//       await parser.runConnectionTests()
//     } else if (action === 'step2') {
//       await parser.runStep2(productId)
//     } else if (action === 'step3') {
//       await parser.runStep3(productId)
//     } else if (action === 'step4') {
//       await parser.runStep4(productId)
//     } else if (action === 'step5') {
//       // ✅ NEW: Parse and clear description workflow
//       await parser.runStep5ParseAndClearDescription(productId)
//     } else if (action === 'clear') {
//       // Helper to clear tabs for testing
//       await parser.removeProductTabs(productId)
//     } else if (action === 'fix-keys') {
//       // Helper to fix missing keys
//       await parser.fixMissingKeys(productId)
//     } else {
//       console.error('❌ Usage: npx tsx src/scripts/html-to-sanity-parser.ts [step1|step2|step3|step4|step5|clear|fix-keys] [product-id]')
//       process.exit(1)
//     }
//   } catch (error: any) {
//     console.error('💥 Parser failed:', error.message)
//     process.exit(1)
//   }
// }

// export { HTMLToSanityParser }

// // ✅ Run if called directly  
// if (require.main === module) {
//   main()
// }
