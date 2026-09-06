import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base, ItemList, EmailItem } from './base'

/*
  "Operator notified" — to Cardinal's operator inbox
  (OPERATOR_NOTIFICATION_EMAIL, falling back to ADMIN_EMAIL) whenever a
  Quote Request or order lands in admin. Sent by
  sendOperatorNotificationStep from the order-form and quote workflows.

  Five flavors share this template, keyed by requestType:
    quote          — new Quote Request, awaiting pricing
    order          — direct Pay-via-Invoice order, awaiting fulfillment
    quote-accepted — customer accepted a priced Quote → new order
    quote-rejected — customer rejected a priced Quote
    quote-message  — customer left a message / change request on a Quote

  Body: submitter + company, optional PO / attn / notes, itemized SKU +
  qty list (no prices), deep link to the admin row.
*/

export const OPERATOR_NOTIFIED = 'operator-notified'

export type OperatorNotifiedRequestType =
  | 'quote'
  | 'order'
  | 'quote-accepted'
  | 'quote-rejected'
  | 'quote-message'

export interface OperatorNotifiedProps {
  requestType: OperatorNotifiedRequestType
  submitterName: string
  companyName: string
  poNumber: string | null
  /** Stored original of the buyer's PO Upload, when one rode along. */
  poFileUrl?: string | null
  attnTo: string | null
  notes: string | null
  items: EmailItem[]
  adminUrl: string
  messageText: string | null
  preview?: string
}

export const isOperatorNotifiedData = (data: any): data is OperatorNotifiedProps =>
  typeof data?.submitterName === 'string' &&
  typeof data?.adminUrl === 'string' &&
  Array.isArray(data?.items)

export const OperatorNotifiedTemplate: React.FC<OperatorNotifiedProps> & {
  PreviewProps?: OperatorNotifiedProps
} = ({ requestType, submitterName, companyName, poNumber, poFileUrl, attnTo, notes, items, adminUrl, messageText, preview }) => {
  const isQuote = requestType === 'quote'
  const isQuoteAccepted = requestType === 'quote-accepted'
  const isQuoteRejected = requestType === 'quote-rejected'
  const isQuoteMessage = requestType === 'quote-message'

  const heading = isQuote
    ? 'New Quote Request'
    : isQuoteAccepted
      ? 'Quote accepted — new order ready'
      : isQuoteRejected
        ? 'Quote rejected by customer'
        : isQuoteMessage
          ? 'Customer replied on a Quote'
          : 'New order placed'
  const actionCopy = isQuote
    ? 'submitted a Quote Request.'
    : isQuoteAccepted
      ? 'accepted your priced Quote. A new order is ready to fulfill in admin.'
      : isQuoteRejected
        ? 'rejected your priced Quote. Review it in admin to revise and resend, or let it stand.'
        : isQuoteMessage
          ? 'left a message on a Quote. Read it below and reply from the quote page in admin.'
          : 'placed an order via Pay-via-Invoice.'
  const ctaLabel =
    isQuote || isQuoteRejected || isQuoteMessage ? 'Open the quote' : 'Open the order'
  const previewText =
    preview ??
    (isQuote
      ? `${submitterName} at ${companyName} submitted a new Quote Request`
      : isQuoteAccepted
        ? `${submitterName} at ${companyName} accepted your Quote`
        : isQuoteRejected
          ? `${submitterName} at ${companyName} rejected your Quote`
          : isQuoteMessage
            ? `${submitterName} at ${companyName} replied on a Quote`
            : `${submitterName} at ${companyName} placed a new order`)

  return (
    <Base preview={previewText}>
      <Heading className="text-xl">{heading}</Heading>
      <Text>
        <strong>{submitterName}</strong> at <strong>{companyName}</strong> just {actionCopy}
      </Text>
      {isQuoteMessage && messageText && (
        <Section className="bg-gray-100 rounded p-3 my-2">
          <Text className="m-0 text-sm whitespace-pre-wrap">{messageText}</Text>
        </Section>
      )}
      {poNumber && (
        <Text className="m-0 text-sm text-gray-600">
          PO number: <strong className="text-black">{poNumber}</strong>
        </Text>
      )}
      {attnTo && (
        <Text className="m-0 text-sm text-gray-600">
          Attn: <strong className="text-black">{attnTo}</strong>
        </Text>
      )}
      {notes && <Text className="m-0 text-sm text-gray-600">Notes from the customer: {notes}</Text>}
      <Text className="mb-0 text-sm text-gray-600">Items requested:</Text>
      <ItemList items={items} />
      <Section className="text-center my-4">
        <Button href={adminUrl} className="bg-black text-white px-5 py-3 rounded">
          {ctaLabel}
        </Button>
        {poFileUrl && (
          <Button
            href={poFileUrl}
            className="bg-white text-black border border-solid border-gray-300 px-5 py-3 rounded ml-3"
          >
            View the buyer&apos;s PO document
          </Button>
        )}
      </Section>
      <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
    </Base>
  )
}

OperatorNotifiedTemplate.PreviewProps = {
  requestType: 'quote',
  submitterName: 'Ada Acme',
  companyName: 'Acme CDU',
  poNumber: 'PO-1042',
  attnTo: 'Receiving',
  notes: 'Need these before the next maintenance window.',
  items: [
    { sku: 'CC-90E-150', title: '90° elbow, 1.5"', qty: 12 },
    { sku: 'CC-TC-200', title: 'Tri-clamp, 2"', qty: 4 },
  ],
  adminUrl: 'https://backend.cardinalcoolingsystems.com/app/quotes/quote_123',
  messageText: null,
}
