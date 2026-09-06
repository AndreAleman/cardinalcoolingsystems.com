import { ArrowUpRightOnBox, CheckCircleSolid } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Table,
  Text,
  Toaster,
  usePrompt,
} from "@medusajs/ui"
import {
  AdminQuoteAddress,
  useQuote,
  useRejectQuote,
  useSendQuote,
} from "../../../hooks/quotes"
import { formatAmount, formatDate } from "../../../lib/format"
import { QuoteLinePricing } from "../components/quote-line-pricing"
import { QuoteMessages } from "../components/quote-messages"
import { QuoteStatusBadge } from "../components/quote-status-badge"

/*
  /app/quotes/:quoteId — the id is the segment after "quotes". Read
  from the path because react-router-dom is not resolvable from this
  package under pnpm's strict layout (same trick as the company page).
*/
const quoteIdFromPath = () => {
  const parts = window.location.pathname.split("/").filter(Boolean)
  return parts[parts.indexOf("quotes") + 1] ?? ""
}

const AddressBlock = ({ address }: { address?: AdminQuoteAddress | null }) => {
  if (!address) {
    return <Text size="small" className="text-ui-fg-muted">Not provided</Text>
  }
  const nameLine = [address.first_name, address.last_name].filter(Boolean).join(" ")
  const cityLine = [address.city, address.province, address.postal_code]
    .filter(Boolean)
    .join(", ")
  return (
    <div className="flex flex-col text-sm">
      {nameLine && <span>{nameLine}</span>}
      {address.company && <span className="text-ui-fg-subtle">{address.company}</span>}
      {address.address_1 && <span>{address.address_1}</span>}
      {address.address_2 && <span>{address.address_2}</span>}
      {cityLine && <span>{cityLine}</span>}
      {address.country_code && <span className="uppercase">{address.country_code}</span>}
      {address.phone && <span className="text-ui-fg-subtle">{address.phone}</span>}
    </div>
  )
}

const QuoteDetailPage = () => {
  const quoteId = quoteIdFromPath()
  const { data, isPending } = useQuote(quoteId)
  const sendQuote = useSendQuote(quoteId)
  const rejectQuote = useRejectQuote(quoteId)
  const prompt = usePrompt()

  const quote = data?.quote

  if (isPending) {
    return (
      <Container className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">Loading…</Text>
      </Container>
    )
  }
  if (!quote) {
    return (
      <Container className="px-6 py-4">
        <Text>Quote not found</Text>
      </Container>
    )
  }

  const order = quote.draft_order
  const currency = order?.currency_code
  const items = order?.items ?? []
  const cartMetadata = (quote.cart?.metadata ?? {}) as Record<string, unknown>
  const poNumber = (cartMetadata.po_number as string | undefined) || ""
  const poFileUrl = (cartMetadata.po_file_url as string | undefined) || ""

  const canSend = ["pending_merchant", "customer_rejected"].includes(quote.status)
  const canReject = !["accepted", "customer_rejected", "merchant_rejected"].includes(
    quote.status
  )

  const handleSend = async () => {
    const confirmed = await prompt({
      title: "Send quote?",
      description:
        "The customer will see the current draft-order prices. Continue?",
      confirmText: "Send",
      cancelText: "Cancel",
      variant: "confirmation",
    })
    if (confirmed) sendQuote.mutate()
  }

  const handleReject = async () => {
    const confirmed = await prompt({
      title: "Reject quote?",
      description: "You are about to reject this quote. Continue?",
      confirmText: "Reject",
      cancelText: "Cancel",
      variant: "confirmation",
    })
    if (confirmed) rejectQuote.mutate()
  }

  return (
    <div className="flex flex-col gap-x-4 gap-y-3 lg:flex-row xl:items-start">
      <div className="flex w-full flex-col gap-y-3">
        {quote.status === "accepted" && (
          <Container className="px-6 py-4 flex items-center justify-between">
            <Text size="small">
              <CheckCircleSolid className="inline-block mr-2 text-ui-tag-green-icon" />
              Quote accepted by the customer — the order is ready for processing.
            </Text>
            <Button
              size="small"
              onClick={() =>
                (window.location.href = `/app/orders/${quote.draft_order_id}`)
              }
            >
              View Order
            </Button>
          </Container>
        )}

        <Container className="flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-4 flex items-center justify-between border-b border-ui-border-base">
            <div className="flex items-center gap-x-3">
              <Heading className="font-sans font-medium h1-core">
                Quote #{order?.display_id ?? "—"}
              </Heading>
              <QuoteStatusBadge status={quote.status} />
            </div>
            <div className="flex items-center gap-x-2">
              <Button
                size="small"
                variant="secondary"
                onClick={() =>
                  (window.location.href = `/app/orders/${quote.draft_order_id}`)
                }
              >
                <ArrowUpRightOnBox />
                Edit prices in Draft Order
              </Button>
              {canReject && (
                <Button
                  size="small"
                  variant="secondary"
                  onClick={handleReject}
                  isLoading={rejectQuote.isPending}
                  disabled={sendQuote.isPending || rejectQuote.isPending}
                >
                  Reject
                </Button>
              )}
              {canSend && (
                <Button
                  size="small"
                  onClick={handleSend}
                  isLoading={sendQuote.isPending}
                  disabled={sendQuote.isPending || rejectQuote.isPending}
                >
                  Send Quote
                </Button>
              )}
            </div>
          </div>

          {/* Items from the draft order */}
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Item</Table.HeaderCell>
                <Table.HeaderCell>SKU</Table.HeaderCell>
                <Table.HeaderCell>Qty</Table.HeaderCell>
                <Table.HeaderCell>Unit price</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {items.map((item) => (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <Text size="small" weight="plus" className="text-ui-fg-base">
                      {item.title}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="text-ui-fg-subtle">
                      {item.variant?.sku ?? "—"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="tabular-nums">{item.quantity}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="tabular-nums">
                      {formatAmount(item.unit_price, currency)}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="small" className="tabular-nums">
                      {formatAmount(
                        item.total ?? item.unit_price * item.quantity,
                        currency
                      )}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>

          {/* Totals */}
          <div className="px-6 py-4 flex flex-col gap-y-1 border-t border-ui-border-base">
            {[
              ["Subtotal", order?.subtotal],
              ["Shipping", order?.shipping_total],
              ["Tax", order?.tax_total],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between">
                <Text size="small" className="text-ui-fg-subtle">{label}</Text>
                <Text size="small" className="text-ui-fg-subtle tabular-nums">
                  {formatAmount(value as number, currency)}
                </Text>
              </div>
            ))}
            <div className="flex items-center justify-between">
              <Text size="small" weight="plus">Quote total</Text>
              <Text size="small" weight="plus" className="tabular-nums">
                {formatAmount(order?.total, currency)}
              </Text>
            </div>
          </div>
        </Container>

        {/* Internal markup calculator */}
        <Container className="flex flex-col p-0 overflow-hidden">
          <QuoteLinePricing quoteId={quote.id} currencyCode={currency} />
        </Container>

        {/* Messages */}
        <Container className="flex flex-col p-0 overflow-hidden">
          <QuoteMessages quote={quote} />
        </Container>
      </div>

      {/* Sidebar */}
      <div className="flex w-full flex-col gap-y-3 xl:max-w-[400px]">
        <Container className="flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-ui-border-base">
            <Text size="small" leading="compact" weight="plus">Customer</Text>
          </div>
          <div className="px-6 py-4 flex flex-col gap-y-2">
            <div className="grid grid-cols-2 items-start">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">Email</Text>
              <Text size="small" className="break-all">{quote.customer?.email ?? "—"}</Text>
            </div>
            <div className="grid grid-cols-2 items-start">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">Phone</Text>
              <Text size="small">{quote.customer?.phone ?? "—"}</Text>
            </div>
            <div className="grid grid-cols-2 items-start">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">Company</Text>
              {quote.customer?.employee?.company?.id ? (
                <a
                  className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  href={`/app/companies/${quote.customer.employee.company.id}`}
                >
                  {quote.customer.employee.company.name || "View company"}
                </a>
              ) : (
                <Text size="small">—</Text>
              )}
            </div>
            <div className="grid grid-cols-2 items-start">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">Requested</Text>
              <Text size="small">{formatDate(quote.created_at)}</Text>
            </div>
          </div>
        </Container>

        <Container className="flex flex-col p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-ui-border-base">
            <Text size="small" leading="compact" weight="plus">Request details</Text>
          </div>
          <div className="px-6 py-4 flex flex-col gap-y-3">
            <div className="grid grid-cols-2 items-start">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">PO number</Text>
              <Text size="small" className="font-mono">{poNumber || "—"}</Text>
            </div>
            {poFileUrl && (
              <div className="grid grid-cols-2 items-start">
                <Text size="small" weight="plus" className="text-ui-fg-subtle">PO document</Text>
                <a
                  className="text-sm text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
                  href={poFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the buyer&apos;s PO document
                </a>
              </div>
            )}
            <div className="grid grid-cols-2 items-start">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">Bill to</Text>
              <AddressBlock address={quote.cart?.billing_address} />
            </div>
            <div className="grid grid-cols-2 items-start">
              <Text size="small" weight="plus" className="text-ui-fg-subtle">Ship to</Text>
              <AddressBlock address={quote.cart?.shipping_address} />
            </div>
          </div>
        </Container>
      </div>

      <Toaster />
    </div>
  )
}

export default QuoteDetailPage
