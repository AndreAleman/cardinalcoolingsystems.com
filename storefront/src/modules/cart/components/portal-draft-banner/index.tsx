"use client"

/*
  "You also have M items in your company order →" — shown on the cart
  page when the signed-in Team Member kept the two carts separate (or
  simply has a Quick Order draft going). Reads the portal draft from
  localStorage after mount (the server render must match the first
  client render), so guests and company-less customers never see it.
*/

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  countStoredCartUnits,
  PORTAL_CART_UPDATED_EVENT,
} from "@modules/account/components/quick-order/cart-storage"

export default function PortalDraftBanner() {
  const [count, setCount] = useState(0)
  const pathname = usePathname()
  const countryCode = /^[a-z]{2}$/.test(pathname?.split("/")[1] ?? "")
    ? (pathname as string).split("/")[1]
    : "us"

  useEffect(() => {
    const read = () => setCount(countStoredCartUnits())
    read()
    window.addEventListener(PORTAL_CART_UPDATED_EVENT, read)
    return () => window.removeEventListener(PORTAL_CART_UPDATED_EVENT, read)
  }, [])

  if (count <= 0) return null

  return (
    <Link
      href={`/${countryCode}/account`}
      className="flex items-center justify-between gap-3 rounded border border-blue-200 bg-blue-50 px-4 py-3 mb-6 text-[16px] text-blue-900 hover:bg-blue-100 transition-colors"
      data-testid="portal-draft-banner"
    >
      <span>
        You also have {count} {count === 1 ? "item" : "items"} in your company
        order
      </span>
      <span aria-hidden="true" className="text-[18px]">
        →
      </span>
    </Link>
  )
}
