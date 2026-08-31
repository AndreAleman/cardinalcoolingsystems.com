"use client"

import { useEffect } from "react"
import { captureEvent } from "@lib/util/posthog"

type Props = {
  pageType: "product" | "category"
  id?: string
  title?: string
  handle?: string
  category?: string
}

// Fires a `product_viewed` analytics event once per product/category page view.
// Renders nothing.
export default function ProductViewTracker({
  pageType,
  id,
  title,
  handle,
  category,
}: Props) {
  useEffect(() => {
    captureEvent("product_viewed", {
      page_type: pageType,
      product_id: id,
      product_title: title,
      product_handle: handle,
      category,
    })
  }, [pageType, id, title, handle, category])

  return null
}
