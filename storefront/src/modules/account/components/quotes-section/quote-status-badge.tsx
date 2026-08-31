"use client"

import { StatusBadge } from "@medusajs/ui"
import type { QuoteStatus } from "@lib/data/quotes"

/* User-facing labels; the raw Medusa status keys stay internal. */
const StatusTitles: Record<QuoteStatus, string> = {
  accepted: "Accepted",
  customer_rejected: "Rejected",
  merchant_rejected: "Rejected",
  pending_merchant: "Waiting for Cardinal",
  pending_customer: "Awaiting your response",
}

const StatusColors: Record<QuoteStatus, "green" | "orange" | "red" | "blue"> = {
  accepted: "green",
  customer_rejected: "red",
  merchant_rejected: "red",
  pending_merchant: "blue",
  pending_customer: "orange",
}

export default function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  return (
    <StatusBadge color={StatusColors[status] ?? "grey"} className="text-[15px]">
      {StatusTitles[status] ?? status}
    </StatusBadge>
  )
}
