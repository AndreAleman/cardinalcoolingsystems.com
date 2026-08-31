"use client"

/*
  Quote details — Cardinal's priced answer to a Quote Request. The
  customer accepts (PO number required — accepting places the order),
  rejects, or writes a Quote Message. Adapted from accurateforklift.net's
  quote-details, minus the adjust flow and without Radix (plain overlay
  modal) to match Cardinal's dependency set.
*/

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Button, Container, Heading, Input, Text, Textarea, Toaster, toast } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { capturePortalEvent } from "@lib/util/portal-analytics"
import {
  acceptQuote,
  rejectQuote,
  createQuoteMessage,
  type PortalQuote,
} from "@lib/data/quotes"
import QuoteStatusBadge from "../quotes-section/quote-status-badge"

type Props = {
  quote: PortalQuote
  preview: PortalQuote | null
  countryCode: string
}

export default function QuoteDetails({ quote, preview, countryCode }: Props) {
  const router = useRouter()
  const order = quote.draft_order
  const previewOrder = preview?.order_preview ?? null

  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [acceptOpen, setAcceptOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const initialPo =
    ((order as any)?.metadata?.po_number as string) ||
    ((quote.cart?.metadata?.po_number as string) ?? "")
  const [poInput, setPoInput] = useState(initialPo)

  const [messageText, setMessageText] = useState("")
  const [isSending, setIsSending] = useState(false)

  const currency = order?.currency_code ?? "usd"
  const fmt = (amount: number) =>
    convertToLocale({ amount, currency_code: currency })

  const items = useMemo(() => {
    // Prefer the live order-edit preview (staged prices/quantities);
    // fall back to the draft order's items.
    const previewItems = (previewOrder as any)?.items
    return (previewItems ?? order?.items ?? []) as any[]
  }, [previewOrder, order])

  const handleAccept = () => {
    if (!poInput.trim()) return
    setIsAccepting(true)
    acceptQuote(quote.id, poInput.trim())
      .then(() => {
        capturePortalEvent("portal_quote_accepted", { quote_id: quote.id })
        setAcceptOpen(false)
        toast.success("Quote accepted — your order has been placed.")
        router.refresh()
      })
      .catch((e: any) =>
        toast.error(e?.message ?? "Could not accept quote — please try again.")
      )
      .finally(() => setIsAccepting(false))
  }

  const handleReject = () => {
    setIsRejecting(true)
    rejectQuote(quote.id)
      .then(() => {
        setRejectOpen(false)
        router.refresh()
      })
      .catch((e: any) => toast.error(e?.message ?? "Could not reject quote."))
      .finally(() => setIsRejecting(false))
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return
    setIsSending(true)
    createQuoteMessage(quote.id, messageText.trim())
      .then(() => {
        setMessageText("")
        router.refresh()
      })
      .catch((e: any) => toast.error(e?.message ?? "Could not send message."))
      .finally(() => setIsSending(false))
  }

  return (
    <div className="flex flex-col gap-y-4" data-testid="quote-details">
      <div className="flex items-center justify-between">
        <LocalizedClientLink
          href="/account"
          className="inline-flex items-center h-12 px-5 rounded-md border border-neutral-300 text-[16px] font-medium hover:bg-neutral-50"
        >
          ← Back to Dashboard
        </LocalizedClientLink>
        <QuoteStatusBadge status={quote.status} />
      </div>

      <Container className="p-6">
        <div className="flex items-baseline justify-between mb-4">
          <Heading level="h2" className="text-xl">
            Quote #{order?.display_id ?? "—"}
          </Heading>
          <Text className="text-neutral-500 text-[15px]">
            {new Date(quote.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
        </div>

        <ul className="divide-y border rounded">
          {items.map((item: any) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="text-[16px] font-medium truncate">
                  {item.title ?? item.product_title}
                </div>
                <div className="text-[14px] font-mono text-neutral-500">
                  {item.variant_sku ?? item.sku ?? ""}
                </div>
              </div>
              <div className="text-right whitespace-nowrap">
                <div className="text-[16px] tabular-nums">
                  {item.quantity} × {fmt(item.unit_price ?? 0)}
                </div>
                <div className="text-[15px] text-neutral-500 tabular-nums">
                  {fmt((item.unit_price ?? 0) * (item.quantity ?? 0))}
                </div>
              </div>
            </li>
          ))}
          {!items.length && (
            <li className="px-4 py-3 text-neutral-500 text-[15px]">
              No items on this quote.
            </li>
          )}
        </ul>

        <div className="flex justify-between mt-4 text-[17px]">
          <span className="font-semibold">Total</span>
          <span className="font-semibold tabular-nums">
            {fmt(((previewOrder as any)?.total ?? order?.total ?? 0) as number)}
          </span>
        </div>
      </Container>

      {quote.status === "accepted" && (
        <Container className="p-4 flex items-center justify-between">
          <Text className="text-[16px]">
            ✓ Quote accepted — your order is being processed.
          </Text>
          <Button
            className="h-12 px-5 text-[16px]"
            onClick={() =>
              router.push(
                `/${countryCode}/account/orders/details/${quote.draft_order_id}`
              )
            }
          >
            View Order
          </Button>
        </Container>
      )}

      {quote.status === "pending_customer" && (
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            className="h-12 px-6 text-[17px]"
            onClick={() => setRejectOpen(true)}
          >
            Reject Quote
          </Button>
          <Button
            variant="primary"
            className="h-12 px-6 text-[17px] bg-green-600 hover:bg-green-700"
            onClick={() => {
              setPoInput(initialPo)
              setAcceptOpen(true)
            }}
          >
            Accept Quote
          </Button>
        </div>
      )}

      {/* Messages */}
      <Container className="p-0">
        <div className="px-6 py-4 border-b">
          <Heading level="h3">Messages</Heading>
        </div>
        <div>
          {(quote.messages ?? []).map((message) => (
            <div
              key={message.id}
              className={`px-6 py-4 text-[16px] flex flex-col gap-y-1 ${
                message.customer_id ? "bg-neutral-50" : ""
              }`}
            >
              <div className="font-semibold text-[14px] text-neutral-500">
                {message.customer_id ? "You" : "Cardinal Cooling"}
              </div>
              <div>{message.text}</div>
            </div>
          ))}
          {!(quote.messages ?? []).length && (
            <p className="px-6 py-4 text-neutral-500 text-[15px] m-0">
              No messages yet. Ask a question or request a change below.
            </p>
          )}
        </div>
        <form
          onSubmit={handleSendMessage}
          className="px-6 py-4 border-t flex flex-col gap-3"
        >
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Write a message to Cardinal (e.g. ask about pricing or lead time)"
            rows={3}
            disabled={isSending}
            className="text-[16px]"
          />
          <Button
            type="submit"
            className="self-end h-12 px-6 text-[16px]"
            disabled={isSending || !messageText.trim()}
          >
            {isSending ? "Sending..." : "Send message"}
          </Button>
        </form>
      </Container>

      {/* Accept modal — PO required to place the order. */}
      {acceptOpen && (
        <div
          className="fixed inset-0 z-[75] bg-black/50 flex items-center justify-center p-4"
          onClick={() => !isAccepting && setAcceptOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Accept quote"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Heading level="h2" className="mb-2">
              Accept Quote
            </Heading>
            <Text className="text-neutral-600 mb-4 text-[16px]">
              Enter your Purchase Order number to place this order. This
              action is final.
            </Text>
            <label
              htmlFor="accept-quote-po"
              className="block text-[15px] font-semibold text-neutral-700 mb-1"
            >
              PO Number <span className="text-red-600">*</span>
            </label>
            <Input
              id="accept-quote-po"
              autoFocus
              placeholder="e.g. PO-12345"
              value={poInput}
              onChange={(e) => setPoInput(e.target.value)}
              disabled={isAccepting}
              className="h-12 text-[16px]"
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                className="h-12 px-5 text-[16px]"
                onClick={() => setAcceptOpen(false)}
                disabled={isAccepting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="h-12 px-5 text-[16px] bg-green-600 hover:bg-green-700"
                disabled={!poInput.trim() || isAccepting}
                onClick={handleAccept}
              >
                {isAccepting ? "Accepting..." : "Accept Quote"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject confirm */}
      {rejectOpen && (
        <div
          className="fixed inset-0 z-[75] bg-black/50 flex items-center justify-center p-4"
          onClick={() => !isRejecting && setRejectOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Reject quote"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Heading level="h2" className="mb-2">
              Reject Quote?
            </Heading>
            <Text className="text-neutral-600 mb-6 text-[16px]">
              Are you sure you want to reject this quote? This cannot be
              undone. If you&apos;d rather negotiate, send Cardinal a message
              instead.
            </Text>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                className="h-12 px-5 text-[16px]"
                onClick={() => setRejectOpen(false)}
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="h-12 px-5 text-[16px]"
                onClick={handleReject}
                disabled={isRejecting}
              >
                {isRejecting ? "Rejecting..." : "Reject Quote"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toaster />
    </div>
  )
}
