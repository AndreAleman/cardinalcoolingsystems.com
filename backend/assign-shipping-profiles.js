// assign-shipping-profiles.js
// Assigns the default shipping profile to all products that have none
// Run: MEDUSA_ADMIN_EMAIL=... MEDUSA_ADMIN_PASSWORD=... node assign-shipping-profiles.js

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000'
const ADMIN_EMAIL = process.env.MEDUSA_ADMIN_EMAIL
const ADMIN_PASSWORD = process.env.MEDUSA_ADMIN_PASSWORD

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('❌ Missing env vars')
  console.error('Usage: MEDUSA_ADMIN_EMAIL=you@email.com MEDUSA_ADMIN_PASSWORD=yourpass node assign-shipping-profiles.js')
  process.exit(1)
}

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

async function main() {
  console.log('🔐 Authenticating...')
  const token = await getAdminToken()
  console.log('✅ Authenticated\n')

  // Get default shipping profile
  console.log('📦 Fetching shipping profiles...')
  const profilesRes = await fetch(`${BACKEND_URL}/admin/shipping-profiles`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const profilesData = await profilesRes.json()
  const profiles = profilesData.shipping_profiles || []
  
  const defaultProfile = profiles.find(p => p.type === 'default') || profiles[0]
  if (!defaultProfile) {
    console.error('❌ No shipping profile found. Create one in Medusa Admin first.')
    process.exit(1)
  }
  console.log(`✅ Using profile: "${defaultProfile.name}" (${defaultProfile.id})\n`)

  // Get all products
  console.log('📦 Fetching all products...')
  const productsRes = await fetch(`${BACKEND_URL}/admin/products?limit=200&fields=id,title,shipping_profile`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const productsData = await productsRes.json()
  const products = productsData.products || []
  console.log(`✅ Found ${products.length} products\n`)

  // Filter products without a shipping profile
  const unassigned = products.filter(p => !p.shipping_profile)
  console.log(`🔍 ${unassigned.length} products need a shipping profile assigned\n`)

  let updated = 0
  let failed = 0

  for (const product of unassigned) {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/products/${product.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ shipping_profile_id: defaultProfile.id })
      })
      
      if (res.ok) {
        console.log(`✅ Assigned: ${product.title}`)
        updated++
      } else {
        const err = await res.json()
        console.error(`❌ Failed: ${product.title} — ${JSON.stringify(err)}`)
        failed++
      }
    } catch (err) {
      console.error(`❌ Error: ${product.title} — ${err.message}`)
      failed++
    }
  }

  console.log(`\n🎉 Done! Updated: ${updated}, Failed: ${failed}`)
}

main().catch(console.error)
