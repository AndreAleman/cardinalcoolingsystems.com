// update-products.js
// Run: MEDUSA_ADMIN_EMAIL=... MEDUSA_ADMIN_PASSWORD=... node update-products.js
// Updates product description, meta_title, and meta_description for all products in product-seo-data.json

const fs = require('fs')

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing env vars')
  console.error('Usage: MEDUSA_ADMIN_EMAIL=you@email.com MEDUSA_ADMIN_PASSWORD=yourpass node update-products.js')
  process.exit(1)
}

if (!fs.existsSync('./product-seo-data.json')) {
  console.error('❌ product-seo-data.json not found.')
  process.exit(1)
}

const seoData = JSON.parse(fs.readFileSync('./product-seo-data.json', 'utf8'))

async function getAdminToken() {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  const data = await res.json()
  if (!data.token) { console.error('❌ Auth failed:', data); process.exit(1) }
  return data.token
}

async function getAllProducts(token) {
  const res = await fetch(`${BACKEND_URL}/admin/products?limit=200&fields=id,handle,title,description,metadata`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  return data.products || []
}

async function updateProduct(token, productId, payload) {
  const res = await fetch(`${BACKEND_URL}/admin/products/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload)
  })
  return res.json()
}

async function main() {
  console.log('🔐 Authenticating...')
  const token = await getAdminToken()
  console.log('✅ Authenticated\n')

  console.log('📦 Fetching products...')
  const products = await getAllProducts(token)
  console.log(`✅ Found ${products.length} products\n`)

  let updated = 0, skipped = 0

  for (const handle of Object.keys(seoData)) {
    const product = products.find(p => p.handle === handle)
    if (!product) {
      console.log(`⚠️  No product found for handle: ${handle} — skipping`)
      skipped++
      continue
    }

    const seo = seoData[handle]

    // Update description + metadata for meta_title and meta_description
    const payload = {
      description: seo.description,
      metadata: {
        ...(product.metadata || {}),
        meta_title: seo.meta_title,
        meta_description: seo.meta_description
      }
    }

    try {
      await updateProduct(token, product.id, payload)
      console.log(`✅ Updated: ${product.title}`)
      updated++
    } catch (err) {
      console.error(`❌ Failed to update ${handle}:`, err.message)
    }
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}`)
}

main().catch(console.error)
