import { sdk } from "@lib/config"
import { getAuthHeaders, getCartId } from "@lib/data/cookies"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cartId = getCartId()
    if (!cartId) return NextResponse.json({ cart: null })

    const { cart } = await sdk.store.cart.retrieve(
      cartId,
      {
        fields:
          "+items.*,+items.variant.*,+items.variant.product.*,+items.variant.product.images.*,+shipping_methods.*",
      },
      { ...getAuthHeaders() }
    )

    return NextResponse.json({ cart })
  } catch {
    return NextResponse.json({ cart: null })
  }
}

export const dynamic = "force-dynamic"
