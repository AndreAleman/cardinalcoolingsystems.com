import { Badge } from "@medusajs/ui"
import { CompanyStatus } from "../../../hooks/companies"

const COLOR: Record<CompanyStatus, "orange" | "green" | "red"> = {
  pending: "orange",
  approved: "green",
  declined: "red",
}

export const CompanyStatusBadge = ({ status }: { status: CompanyStatus }) => (
  <Badge size="2xsmall" rounded="full" color={COLOR[status]}>
    {status}
  </Badge>
)
