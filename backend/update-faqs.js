// update-faqs.js
// Run after generate-faqs.js: node update-faqs.js
// Pushes faq_items metadata to all categories in Medusa

const fs = require('fs')

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing env vars')
  console.error('Usage: MEDUSA_ADMIN_EMAIL=you@email.com MEDUSA_ADMIN_PASSWORD=yourpass node update-faqs.js')
  process.exit(1)
}

if (!fs.existsSync('./faq-data.json')) {
  console.error('❌ faq-data.json not found. Run generate-faqs.js first.')
  process.exit(1)
}

const faqData = JSON.parse(fs.readFileSync('./faq-data.json', 'utf8'))

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
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
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

  let updated = 0, skipped = 0

  for (const handle of Object.keys(faqData)) {
    const category = categories.find(c => c.handle === handle)
    if (!category) {
      console.log(`⚠️  No category found for handle: ${handle} — skipping`)
      skipped++
      continue
    }

    const faqs = faqData[handle]
    if (!faqs || faqs.length === 0) {
      console.log(`⚠️  No FAQs for ${handle} — skipping`)
      skipped++
      continue
    }

    const newMetadata = {
      ...(category.metadata || {}),
      faq_items: JSON.stringify(faqs)
    }

    try {
      await updateCategory(token, category.id, newMetadata)
      console.log(`✅ Updated: ${category.name} (${faqs.length} FAQs)`)
      updated++
    } catch (err) {
      console.error(`❌ Failed to update ${handle}:`, err.message)
    }
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Skipped: ${skipped}`)
}

main().catch(console.error)
