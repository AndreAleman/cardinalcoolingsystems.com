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
import { trustHeaders } from "./storefront-trust"

export type GuestQuotePayload = {
  email: string
  first_name: string
  last_name: string
  company_name: string
  phone?: string
  notes?: string
  /* Bot guard (plan B4, same fields as the contact form): honeypot, time on form, Turnstile. */
  website?: string
  elapsed_ms?: number
  turnstile_token?: string
}

export type GuestQuoteResult = { success: true } | { success: false; message: string }

/* The bot guard's refusals in words a buyer can act on (plan B4). */
function guardMessage(error: any): string | null {
  const status = error?.status ?? error?.response?.status
  const text = String(error?.message ?? "")
  if (status === 429 || /rate_limited/i.test(text)) {
    return "Too many quote requests from your network. Please wait a few minutes and try again, or email aleman@cardinalcoolingsystems.com."
  }
  if (status === 403 || /challenge_failed/i.test(text)) {
    return "We couldn't verify your browser. Please reload the page and try again, or email aleman@cardinalcoolingsystems.com."
  }
  return null
}

/*
  Returns instead of throwing for the bot guard's refusals (Next strips
  server-action error messages in production). A honeypot hit comes back
  200 { success: true } with no quote_id and is treated as success.
*/
export async function submitGuestQuote(
  payload: GuestQuotePayload
): Promise<GuestQuoteResult> {
  const cartId = getCartId()
  if (!cartId) {
    return { success: false, message: "Your cart is empty — add items before requesting a quote." }
  }

  let refused = null as string | null
  await sdk.client
    .fetch("/store/order-form/guest-quote", {
      method: "POST",
      // A server action: forward the buyer's address (rate limit) and the Turnstile token.
      headers: trustHeaders(payload.turnstile_token),
      body: {
        cart_id: cartId,
        email: payload.email,
        first_name: payload.first_name,
        last_name: payload.last_name,
        company_name: payload.company_name,
        phone: payload.phone || undefined,
        notes: payload.notes || undefined,
        website: payload.website ?? "",
        elapsed_ms: payload.elapsed_ms,
        turnstile_token: payload.turnstile_token,
      },
    })
    .catch((err) => {
      refused = guardMessage(err)
      if (refused) return
      try {
        medusaError(err)
      } catch (e: any) {
        refused = e?.message || "Something went wrong. Please try again."
      }
    })
  if (refused) return { success: false, message: refused }

  // Deliberately NO cart clear / revalidate here: that re-renders the
  // page and unmounts the modal, wiping the persistent confirmation the
  // buyer is supposed to read. finalizeGuestQuote runs on close instead.
  return { success: true }
}

/* Called when the buyer dismisses the confirmation: the cart now
   belongs to the quote request, so clear it and refresh the page. */
export async function finalizeGuestQuote(): Promise<void> {
  removeCartId()
  revalidateTag("cart")
}
