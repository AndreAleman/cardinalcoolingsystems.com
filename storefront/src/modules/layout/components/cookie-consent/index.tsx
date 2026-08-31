"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { getConsent, setConsent, type ConsentValue } from "./consent"

export default function CookieConsent() {
  const { countryCode } = useParams()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!getConsent()) {
      setVisible(true)
    }
  }, [])

  const choose = (value: ConsentValue) => {
    setConsent(value)
    setVisible(false)
    if (value === "declined") {
      ;(window as any).posthog?.opt_out_capturing?.()
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-0 inset-x-0 z-50 border-t border-gray-800 text-white"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p className="text-sm text-gray-300 flex-1">
          We use cookies and similar technologies to run our site, analyze
          traffic, and support our marketing, including identifying business
          visitors. See our{" "}
          <Link
            href={`/${countryCode || "us"}/privacy-policy`}
            className="underline hover:text-white"
          >
            Privacy Policy
          </Link>{" "}
          for details and opt-out options.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => choose("declined")}
            className="px-4 py-2 text-sm border border-gray-600 rounded hover:border-gray-400 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={() => choose("accepted")}
            className="px-4 py-2 text-sm bg-white text-gray-900 rounded font-medium hover:bg-gray-200 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
