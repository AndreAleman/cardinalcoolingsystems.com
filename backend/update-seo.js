// update-seo.js
// Run from your backend directory: node update-seo.js
// Requires: MEDUSA_ADMIN_EMAIL and MEDUSA_ADMIN_PASSWORD env vars

const seoData = require('./seo-data.json')

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing MEDUSA_ADMIN_EMAIL or MEDUSA_ADMIN_PASSWORD env vars')
  console.error('Usage: MEDUSA_ADMIN_EMAIL=you@email.com MEDUSA_ADMIN_PASSWORD=yourpass node update-seo.js')
  process.exit(1)
}

async function getAdminToken() {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  })
  const data = await res.json()
  if (!data.token) {
    console.error('❌ Auth failed:', data)
    process.exit(1)
  }
  return data.token
}

async function getAllCategories(token) {
  const res = await fetch(`${BACKEND_URL}/admin/product-categories?limit=200&fields=id,handle,name,metadata`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  return data.product_categories || []
}

async function updateCategory(token, categoryId, metadata) {
  const res = await fetch(`${BACKEND_URL}/admin/product-categories/${categoryId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ metadata })
  })
  return res.json()
}

async function main() {
  console.log('🔐 Authenticating...')
  const token = await getAdminToken()
  console.log('✅ Authenticated\n')

  console.log('📦 Fetching categories...')
  const categories = await getAllCategories(token)
  console.log(`✅ Found ${categories.length} categories\n`)

  const handles = Object.keys(seoData)
  let updated = 0
  let skipped = 0

  for (const handle of handles) {
    const category = categories.find(c => c.handle === handle)
    if (!category) {
      console.log(`⚠️  No category found for handle: ${handle} — skipping`)
      skipped++
      continue
    }

    const seo = seoData[handle]
    const newMetadata = {
      ...(category.metadata || {}),
      seo_title: seo.seo_title,
      seo_description: seo.seo_description,
      seo_content: seo.seo_content
    }

    try {
      await updateCategory(token, category.id, newMetadata)
      console.log(`✅ Updated: ${category.name} (${handle})`)
      updated++
    } catch (err) {
      console.error(`❌ Failed to update ${handle}:`, err.message)
    }
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}`)
}

main().catch(console.error)
