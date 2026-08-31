import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CheckCircle } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  StatusBadge,
  Table,
  Text,
  Toaster,
  usePrompt,
} from "@medusajs/ui"
import { useState } from "react"
import {
  AdminApproval,
  ApprovalStatus,
  useApprovals,
  useUpdateApproval,
} from "../../hooks/approvals"
import { formatAmount, formatDate } from "../../lib/format"

const FILTERS: { label: string; status?: ApprovalStatus }[] = [
  { label: "Pending", status: "pending" },
  { label: "Approved", status: "approved" },
  { label: "Rejected", status: "rejected" },
  { label: "All" },
]

const STATUS_COLORS: Record<ApprovalStatus, "orange" | "green" | "red"> = {
  pending: "orange",
  approved: "green",
  rejected: "red",
}

const ApprovalRow = ({ approval }: { approval: AdminApproval }) => {
  const updateApproval = useUpdateApproval()
  const prompt = usePrompt()

  const decide = async (status: "approved" | "rejected") => {
    const confirmed = await prompt({
      title: status === "approved" ? "Approve this cart?" : "Reject this cart?",
      description:
        status === "approved"
          ? "The team member will be able to complete checkout."
          : "The team member's cart will be unlocked but cannot be completed as-is.",
      confirmText: status === "approved" ? "Approve" : "Reject",
      cancelText: "Cancel",
      variant: "confirmation",
    })
    if (confirmed) updateApproval.mutate({ id: approval.id, status })
  }

  const itemCount = (approval.cart?.items ?? []).reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  )

  return (
    <Table.Row>
      <Table.Cell>
        <Text size="small" className="font-mono text-ui-fg-subtle">
          {approval.cart_id}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="small">
          {approval.cart?.company?.name || (
            <span className="text-ui-fg-muted">—</span>
          )}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="small" className="tabular-nums">
          {itemCount > 0 ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : "—"}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="small" className="tabular-nums">
          {formatAmount(approval.cart?.total, "usd")}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="small" className="text-ui-fg-muted">
          {formatDate(approval.created_at)}
        </Text>
      </Table.Cell>
      <Table.Cell>
        <StatusBadge color={STATUS_COLORS[approval.status]}>
          {approval.status}
        </StatusBadge>
      </Table.Cell>
      <Table.Cell>
        {approval.status === "pending" && (
          <div className="flex justify-end gap-2">
            <Button
              size="small"
              variant="secondary"
              disabled={updateApproval.isPending}
              onClick={() => decide("rejected")}
            >
              Reject
            </Button>
            <Button
              size="small"
              disabled={updateApproval.isPending}
              onClick={() => decide("approved")}
            >
              Approve
            </Button>
          </div>
        )}
      </Table.Cell>
    </Table.Row>
  )
}

const ApprovalsPage = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(FILTERS[0])
  const { data, isPending } = useApprovals(filter.status)
  const approvals = data?.approvals ?? []

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-ui-border-base">
          <div>
            <Heading className="font-sans font-medium h1-core">Approvals</Heading>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Carts held for admin approval. Approving unlocks checkout for the team member.
            </Text>
          </div>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <Button
                key={f.label}
                size="small"
                variant={f.label === filter.label ? "secondary" : "transparent"}
                onClick={() => setFilter(f)}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </div>

        {isPending ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">Loading…</Text>
          </div>
        ) : approvals.length === 0 ? (
          <div className="px-6 py-4">
            <Text size="small" className="text-ui-fg-subtle">Nothing here.</Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Cart</Table.HeaderCell>
                <Table.HeaderCell>Company</Table.HeaderCell>
                <Table.HeaderCell>Items</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
                <Table.HeaderCell>Requested</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell></Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {approvals.map((approval) => (
                <ApprovalRow key={approval.id} approval={approval} />
              ))}
            </Table.Body>
          </Table>
        )}
      </Container>
      <Toaster />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Approvals",
  icon: CheckCircle,
})

export default ApprovalsPage
