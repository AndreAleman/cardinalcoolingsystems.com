"use client"

import { useState } from "react"
import Link from "next/link"

export default function UserActions() {
  const [cartCount] = useState(0) // Replace with actual cart data from MedusaJS

  return (
    <div className="hidden lg:flex items-center space-x-8"> {/* Added 'hidden lg:flex' to hide on mobile */}
      {/* Account with icon on the right */}
      <Link
        href="/account"
        className="flex items-center space-x-2 text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2"
      >
        <span>Account</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </Link>

      {/* Cart with icon on the right */}
      <Link
        href="/cart"
        className="flex items-center space-x-2 text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2"
      >
        <span>Cart</span>
        <div className="flex items-center space-x-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          {cartCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full px-2 py-0.5 font-medium min-w-[20px] text-center">
              {cartCount}
            </span>
          )}
        </div>
      </Link>
    </div>
  )
}
