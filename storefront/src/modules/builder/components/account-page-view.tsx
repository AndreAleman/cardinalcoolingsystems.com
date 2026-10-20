"use client"

import { captureEvent } from "@lib/util/posthog"
import { useEffect } from "react"

/** Per-account page view (B15): one `account_page_viewed` event per page load, client-side. */
export default function AccountPageView({ slug, company }: { slug: string; company: string }) {
  useEffect(() => {
    captureEvent("account_page_viewed", { slug, company })
  }, [slug, company])
  return null
}
