"use server"

/*
  Guest Quote (CONTEXT.md): a Quote Request from the public cart with no
  account required. The backend route is PUBLIC — publishable key only,
  the SDK adds it; no auth header. On success the cart cookie is cleared
  (the cart now belongs to the quote request).
*/

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { getCartId, removeCartId } from "./cookies"

export type GuestQuotePayload = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  phone?: string
  notes?: string
}

export async function submitGuestQuote(
  payload: GuestQuotePayload
): Promise<{ success: true }> {
  const cartId = getCartId()
  if (!cartId) {
    throw new Error("Your cart is empty — add items before requesting a quote.")
  }

  await sdk.client
    .fetch("/store/order-form/guest-quote", {
      method: "POST",
      body: {
        cart_id: cartId,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        company_name: payload.company_name,
        phone: payload.phone || undefined,
        notes: payload.notes || undefined,
      },
    })
    .catch(medusaError)

  removeCartId()
  revalidateTag("cart")
  return { success: true }
}
