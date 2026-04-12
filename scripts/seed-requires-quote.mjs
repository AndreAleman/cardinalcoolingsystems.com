#!/usr/bin/env node
/**
 * Adds `requires_quote: false` to every product's metadata (if not already set).
 * Run: node scripts/seed-requires-quote.mjs
 */

const BACKEND_URL = "http://localhost:9000"
const ADMIN_EMAIL = "admin@yourmail.com"
const ADMIN_PASSWORD = "lbd9fbfl5hgxj7jzfevy0yuagyft1fd3"

async function getToken() {
  const res = await fetch(`${BACKEND_URL}/auth/user/emailpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  })
  if (!res.ok) throw new Error(`Auth failed: ${await res.text()}`)
  const { token } = await res.json()
  return token
}

async function getAllProducts(token) {
  const products = []
  let offset = 0
  const limit = 100

  while (true) {
    const res = await fetch(
      `${BACKEND_URL}/admin/products?limit=${limit}&offset=${offset}&fields=id,metadata`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) throw new Error(`List products failed: ${await res.text()}`)
    const { products: page, count } = await res.json()
    products.push(...page)
    offset += page.length
    if (offset >= count) break
  }

  return products
}

async function updateProduct(token, id, metadata) {
  const res = await fetch(`${BACKEND_URL}/admin/products/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ metadata }),
  })
  if (!res.ok) throw new Error(`Update ${id} failed: ${await res.text()}`)
}

async function main() {
  console.log("Authenticating…")
  const token = await getToken()

  console.log("Fetching all products…")
  const products = await getAllProducts(token)
  console.log(`Found ${products.length} products`)

  let updated = 0
  let skipped = 0

  for (const product of products) {
    if (product.metadata?.requires_quote !== undefined) {
      // already has the key — don't overwrite
      skipped++
      continue
    }

    const newMetadata = { ...(product.metadata ?? {}), requires_quote: false }
    await updateProduct(token, product.id, newMetadata)
    console.log(`  ✓ ${product.id}`)
    updated++
  }

  console.log(`\nDone — ${updated} updated, ${skipped} already had the key`)
}

main().catch((err) => {
  console.error("Error:", err.message)
  process.exit(1)
})
