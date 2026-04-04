"use client"
import Link from "next/link"
import { useCartCount } from "@lib/hooks/use-cart-count"

export default function UserActions() {
  const cartCount = useCartCount()

  return (
    <div className="hidden lg:flex items-center space-x-6">
      {/* Cart */}
      <Link
        href="/cart"
        className="flex items-center gap-2 text-base font-medium tracking-wide transition-colors duration-200 py-2"
        style={{ color: "rgba(255,255,255,0.85)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "white")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)")}
      >
        <span>Cart</span>
        <div className="relative flex items-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {cartCount > 0 && (
            <span
              className="absolute -top-3 -right-3 text-white text-[10px] w-4 h-4 flex items-center justify-center font-semibold leading-none"
              style={{ backgroundColor: "#E3000F" }}
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </div>
      </Link>

      {/* Account */}
      <Link
        href="/account"
        className="flex items-center gap-2 text-base font-medium tracking-wide transition-colors duration-200 py-2"
        style={{ color: "rgba(255,255,255,0.85)" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "white")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.85)")}
      >
        <span>Account</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>

      {/* Request A Quote CTA */}
      <Link
        href="/contact"
        className="flex items-center gap-2 px-5 py-2.5 text-base font-semibold tracking-wide text-white transition-all duration-200"
        style={{ backgroundColor: "#E3000F", border: "1px solid #E3000F" }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F")}
      >
        Request A Quote
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
