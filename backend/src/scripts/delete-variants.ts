// src/scripts/delete-product-by-sku.ts

import Medusa from "@medusajs/js-sdk"

// Configure your Medusa backend URL and (optionally) publishable key
const MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY

const sdk = new Medusa({
  baseUrl: MEDUSA_BACKEND_URL,
  debug: process.env.NODE_ENV === "development",
  publishableKey: PUBLISHABLE_KEY,
})

// Replace with the SKU you want to delete
const TARGET_SKU = "13h-400"

async function deleteProductBySku(sku: string) {
  // List all products (pagination may be needed for large catalogs)
  const { products } = await sdk.admin.product.list()

  // Find the product with the matching SKU in any of its variants
  const product = products.find((p) =>
    p.variants?.some((variant) => variant.sku === sku)
  )

  if (!product) {
    console.log(`No product found with SKU: ${sku}`)
    return
  }

  // Delete the product by ID
  await sdk.admin.product.delete(product.id)
  console.log(`Product with SKU ${sku} and ID ${product.id} deleted.`)
}

deleteProductBySku(TARGET_SKU).catch(console.error)