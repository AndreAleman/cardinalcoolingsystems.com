import { retrieveCart } from "@lib/data/cart"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const cart = await retrieveCart()
    const count = cart?.items?.reduce((total, item) => total + item.quantity, 0) ?? 0
    
    return NextResponse.json({ count })
  } catch (error) {
    return NextResponse.json({ count: 0 })
  }
}

export const dynamic = 'force-dynamic' // Don't cache this route
