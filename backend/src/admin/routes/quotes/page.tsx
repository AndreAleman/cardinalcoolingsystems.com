import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import {
  Badge,
  Container,
  Heading,
  Table,
  Text,
  Tooltip,
} from "@medusajs/ui"
import { useQuoteRequests, QuoteDraftOrder } from "../../hooks/quotes"

// ── helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function TimelineBadge({ timeline }: { timeline?: string }) {
  if (!timeline) return <Text className="text-ui-fg-muted text-xs">—</Text>
  const color =
    timeline.toLowerCase().includes("soon") ||
    timeline.toLowerCase().includes("asap")
      ? "red"
      : timeline.toLowerCase().includes("week")
      ? "orange"
      : "grey"
  return (
    <Badge rounded="full" size="2xsmall" color={color}>
      {timeline}
    </Badge>
  )
}

function ItemsSummary({ items }: { items: QuoteDraftOrder["items"] }) {
  if (!items?.length) return <Text className="text-ui-fg-muted text-xs">—</Text>

  const summary = items
    .map((i) => `${i.variant?.sku ?? i.title} ×${i.quantity}`)
    .join(", ")

  const label = `${items.length} ${items.length === 1 ? "item" : "items"}`

  return (
    <Tooltip content={summary}>
      <Text className="text-ui-fg-base text-xs cursor-default underline decoration-dotted underline-offset-2">
        {label}
      </Text>
    </Tooltip>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

const QuotesRoute = () => {
  const { draft_orders, isLoading, refetch } = useQuoteRequests()

  return (
    <Container className="flex flex-col p-0 overflow-hidden">
      {/* Header */}
      <div className="p-6 flex items-center justify-between border-b border-ui-border-base">
        <div>
          <Heading className="font-sans font-medium h1-core">
            Quote Requests
          </Heading>
          <Text className="text-ui-fg-muted text-sm mt-0.5">
            {isLoading ? "Loading…" : `${draft_orders.length} pending`}
          </Text>
        </div>
        <button
          onClick={() => refetch()}
          className="text-xs text-ui-fg-muted hover:text-ui-fg-base transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {!isLoading && draft_orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <DocumentText className="text-ui-fg-muted" />
          <Text className="text-ui-fg-muted text-sm">No quote requests yet</Text>
          <Text className="text-ui-fg-subtle text-xs">
            Submitted quotes from the storefront will appear here.
          </Text>
        </div>
      ) : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>#</Table.HeaderCell>
              <Table.HeaderCell>Customer</Table.HeaderCell>
              <Table.HeaderCell>Company</Table.HeaderCell>
              <Table.HeaderCell>Items</Table.HeaderCell>
              <Table.HeaderCell>Timeline</Table.HeaderCell>
              <Table.HeaderCell>Notes</Table.HeaderCell>
              <Table.HeaderCell>Submitted</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {draft_orders.map((order) => (
              <Table.Row
                key={order.id}
                className="cursor-pointer hover:bg-ui-bg-subtle transition-colors"
                onClick={() =>
                  (window.location.href = `/app/orders/${order.id}`)
                }
              >
                {/* Display ID */}
                <Table.Cell>
                  <Text className="text-ui-fg-base text-sm font-medium">
                    #{order.display_id}
                  </Text>
                </Table.Cell>

                {/* Customer email + phone */}
                <Table.Cell>
                  <Text className="text-ui-fg-base text-sm">{order.email}</Text>
                  {order.metadata?.phone && (
                    <Text className="text-ui-fg-muted text-xs">
                      {order.metadata.phone}
                    </Text>
                  )}
                </Table.Cell>

                {/* Company */}
                <Table.Cell>
                  <Text className="text-ui-fg-base text-sm">
                    {order.metadata?.company || (
                      <span className="text-ui-fg-muted">—</span>
                    )}
                  </Text>
                </Table.Cell>

                {/* Items */}
                <Table.Cell>
                  <ItemsSummary items={order.items} />
                </Table.Cell>

                {/* Timeline */}
                <Table.Cell>
                  <TimelineBadge timeline={order.metadata?.timeline} />
                </Table.Cell>

                {/* Notes — truncated */}
                <Table.Cell className="max-w-[200px]">
                  {order.metadata?.notes ? (
                    <Tooltip content={order.metadata.notes}>
                      <Text className="text-ui-fg-muted text-xs truncate cursor-default underline decoration-dotted underline-offset-2 block max-w-[180px]">
                        {order.metadata.notes}
                      </Text>
                    </Tooltip>
                  ) : (
                    <Text className="text-ui-fg-muted text-xs">—</Text>
                  )}
                </Table.Cell>

                {/* Date */}
                <Table.Cell>
                  <Text className="text-ui-fg-muted text-sm">
                    {formatDate(order.created_at)}
                  </Text>
                </Table.Cell>

                {/* Status */}
                <Table.Cell>
                  <Badge
                    rounded="full"
                    size="2xsmall"
                    color={order.status === "open" ? "blue" : "green"}
                  >
                    {order.status}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Quotes",
  icon: DocumentText,
})

export default QuotesRoute
