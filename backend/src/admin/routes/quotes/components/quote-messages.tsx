import { Button, Text, Textarea, clx } from "@medusajs/ui"
import { useState } from "react"
import {
  AdminQuote,
  useCreateQuoteMessage,
} from "../../../hooks/quotes"
import { formatDate } from "../../../lib/format"

/* Message thread between Cardinal and the customer, with a reply box.
   Admin messages (admin_id set) are highlighted. */
export const QuoteMessages = ({ quote }: { quote: AdminQuote }) => {
  const [text, setText] = useState("")
  const createMessage = useCreateQuoteMessage(quote.id)

  const messages = quote.messages ?? []
  const customerName =
    [quote.customer?.first_name, quote.customer?.last_name]
      .filter(Boolean)
      .join(" ") ||
    quote.customer?.email ||
    "Customer"

  const send = () => {
    const trimmed = text.trim()
    if (!trimmed) return
    createMessage.mutate(
      { text: trimmed },
      { onSuccess: () => setText("") }
    )
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 py-4 border-b border-ui-border-base">
        <Text size="small" leading="compact" weight="plus">Messages</Text>
      </div>

      {messages.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">No messages yet.</Text>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-dashed divide-ui-border-base">
          {messages.map((message) => (
            <div
              key={message.id}
              className={clx("px-6 py-4 flex flex-col gap-y-1", {
                "bg-ui-bg-subtle": !!message.admin_id,
              })}
            >
              <div className="flex items-center justify-between">
                <Text size="small" leading="compact" weight="plus" className="text-ui-fg-subtle">
                  {message.admin_id ? "Cardinal" : customerName}
                </Text>
                {message.created_at && (
                  <Text size="xsmall" className="text-ui-fg-muted">
                    {formatDate(message.created_at)}
                  </Text>
                )}
              </div>
              <Text size="small" className="whitespace-pre-wrap">{message.text}</Text>
            </div>
          ))}
        </div>
      )}

      <div className="px-6 py-4 border-t border-ui-border-base flex flex-col gap-y-2">
        <Textarea
          value={text}
          rows={3}
          placeholder="Write a reply to the customer…"
          onChange={(e) => setText(e.target.value)}
        />
        <Button
          size="small"
          className="self-end"
          isLoading={createMessage.isPending}
          disabled={createMessage.isPending || !text.trim()}
          onClick={send}
        >
          Send
        </Button>
      </div>
    </div>
  )
}
