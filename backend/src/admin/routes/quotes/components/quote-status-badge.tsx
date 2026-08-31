import { StatusBadge } from "@medusajs/ui"
import type { QuoteStatus } from "../../../hooks/quotes"

const TITLES: Record<QuoteStatus, string> = {
  pending_merchant: "Pending Merchant",
  pending_customer: "Pending Customer",
  accepted: "Accepted",
  customer_rejected: "Customer Rejected",
  merchant_rejected: "Merchant Rejected",
}

const COLORS: Record<QuoteStatus, "green" | "orange" | "red" | "blue" | "grey"> = {
  pending_merchant: "blue",
  pending_customer: "orange",
  accepted: "green",
  customer_rejected: "red",
  merchant_rejected: "grey",
}

export const QuoteStatusBadge = ({ status }: { status: QuoteStatus }) => (
  <StatusBadge color={COLORS[status] ?? "grey"}>
    {TITLES[status] ?? status}
  </StatusBadge>
)
