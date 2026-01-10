// src/subscribers/revalidate-storefront.ts
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function revalidateStorefrontOnProductUpdate({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const storefrontUrl = process.env.STOREFRONT_URL

  if (!storefrontUrl) {
    console.warn("STOREFRONT_URL is not set, skipping revalidation")
    return
  }

  try {
    // Revalidate store and home pages
    await Promise.all([
      fetch(`${storefrontUrl}/api/revalidate?path=/store`),
      fetch(`${storefrontUrl}/api/revalidate?path=/`),
    ])
  } catch (e) {
    console.error("Failed to revalidate storefront", e)
  }
}

export const config: SubscriberConfig = {
  // event name for product updates in Medusa 2
  event: "product.updated",
}
