import { defineRouteConfig } from "@medusajs/admin-sdk"
import { DocumentText } from "@medusajs/icons"
import { Button, Container, Heading, Table, Text, Toaster } from "@medusajs/ui"
import { useState } from "react"
import { QuoteStatus, useQuotes } from "../../hooks/quotes"
import { formatAmount, formatDate } from "../../lib/format"
import { QuoteStatusBadge } from "./components/quote-status-badge"

const FILTERS: { label: string; statuses?: QuoteStatus[] }[] = [
  { label: "Needs action", statuses: ["pending_merchant"] },
  { label: "Sent", statuses: ["pending_customer"] },
  { label: "Closed", statuses: ["accepted", "customer_rejected", "merchant_rejected"] },
  { label: "All" },
]

const QuotesPage = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(FILTERS[3])
  const { data, isPending } = useQuotes()

  const quotes = (data?.quotes ?? []).filter(
    (quote) => !filter.statuses || filter.statuses.includes(quote.status)
  )

  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between border-b border-ui-border-base">
          <div>
            <Heading className="font-sans font-medium h1-core">Quotes</Heading>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Price pending quotes, then send them back to the customer.
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
        ) : quotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <DocumentText className="text-ui-fg-muted" />
            <Text className="text-ui-fg-muted text-sm">No quotes here</Text>
            <Text className="text-ui-fg-subtle text-xs">
              Quotes requested from the storefront will appear on this page.
            </Text>
          </div>
        ) : (
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Quote</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Company</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {quotes.map((quote) => {
                const customerName = [
                  quote.customer?.first_name,
                  quote.customer?.last_name,
                ]
                  .filter(Boolean)
                  .join(" ")
                return (
                  <Table.Row
                    key={quote.id}
                    className="cursor-pointer hover:bg-ui-bg-subtle transition-colors"
                    onClick={() => (window.location.href = `/app/quotes/${quote.id}`)}
                  >
                    <Table.Cell>
                      <Text size="small" weight="plus" className="text-ui-fg-base">
                        #{quote.draft_order?.display_id ?? "—"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-base">
                        {quote.customer?.email ?? "—"}
                      </Text>
                      {customerName && (
                        <Text size="xsmall" className="text-ui-fg-muted">
                          {customerName}
                        </Text>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small">
                        {quote.customer?.employee?.company?.name || (
                          <span className="text-ui-fg-muted">—</span>
                        )}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="tabular-nums">
                        {formatAmount(
                          quote.draft_order?.total,
                          quote.draft_order?.currency_code
                        )}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="small" className="text-ui-fg-muted">
                        {formatDate(quote.created_at)}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <QuoteStatusBadge status={quote.status} />
                    </Table.Cell>
                  </Table.Row>
                )
              })}
            </Table.Body>
          </Table>
        )}
      </Container>
      <Toaster />
    </>
  )
}

export const config = defineRouteConfig({
  label: "Quotes",
  icon: DocumentText,
})

export default QuotesPage
