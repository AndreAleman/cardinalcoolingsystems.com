// Medusa app: subscriber
import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

export default async function productUpdatedHandler({
  event: { data },
}: SubscriberArgs<{ id: string }>) {
  const storefrontUrl = process.env.STOREFRONT_URL

  if (!storefrontUrl) {
    console.warn("STOREFRONT_URL is not set, skipping revalidation")
    return
  }

  // send request to next.js storefront to revalidate cache
  await fetch(`${storefrontUrl}/api/revalidate?tags=products`)
}

export const config: SubscriberConfig = {
  event: "product.updated",
}
