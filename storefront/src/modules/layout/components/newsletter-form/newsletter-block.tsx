"use client"

import { isBuilderSectionPath } from "@lib/builder/routes"
import { usePathname } from "next/navigation"
import NewsletterForm from "./index"

/**
 * The footer's newsletter row. Hidden on the builder section (/build/**, /for/**,
 * /sanitary-vs-bpe), where the page's own quote action is the one call to action.
 */
export default function NewsletterBlock() {
  const pathname = usePathname()
  if (isBuilderSectionPath(pathname)) return null
  return (
    <div className="py-10 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }} data-testid="newsletter-block">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <h3 className="text-base font-semibold text-white mb-1">Stay Updated</h3>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            Product updates, lead-time news, and cooling-industry insights.
          </p>
        </div>
        <NewsletterForm />
      </div>
    </div>
  )
}
