import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base, ItemList, EmailItem } from './base'

/*
  "Order confirmed" — to the customer immediately after they accept a
  priced Quote (sendQuoteAcceptedClientEmailStep, template
  "quote-accepted-client"), right after the draft is promoted to a
  PENDING order. This is the customer's receipt: order id, PO number,
  itemized SKU + qty list (no prices), CTA to their Dashboard order page.
*/

export const QUOTE_ACCEPTED_CLIENT = 'quote-accepted-client'

export interface QuoteAcceptedClientProps {
  customerFirstName: string | null
  displayOrderId: string
  poNumber: string | null
  items: EmailItem[]
  orderUrl: string
  preview?: string
}

export const isQuoteAcceptedClientData = (data: any): data is QuoteAcceptedClientProps =>
  typeof data?.orderUrl === 'string' && Array.isArray(data?.items)

export const QuoteAcceptedClientTemplate: React.FC<QuoteAcceptedClientProps> & {
  PreviewProps?: QuoteAcceptedClientProps
} = ({ customerFirstName, displayOrderId, poNumber, items, orderUrl, preview }) => (
  <Base preview={preview ?? `Order #${displayOrderId} confirmed`}>
    <Heading className="text-xl">Your order is confirmed</Heading>
    <Text>Hi{customerFirstName ? ` ${customerFirstName}` : ''},</Text>
    <Text>
      Thanks for accepting your Quote. It&apos;s now order <strong>#{displayOrderId}</strong>
      {poNumber ? (
        <>
          {' '}under PO <strong>{poNumber}</strong>
        </>
      ) : null}
      . Our team is getting it ready and will follow up with shipping details.
    </Text>
    <Text className="mb-0 text-sm text-gray-600">Parts on this order:</Text>
    <ItemList items={items} />
    <Section className="text-center my-4">
      <Button href={orderUrl} className="bg-black text-white px-5 py-3 rounded">
        View your order
      </Button>
    </Section>
    <Text className="text-sm text-gray-600">
      Need to make a change? Reply to this email and we&apos;ll take care of it.
    </Text>
    <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
  </Base>
)

QuoteAcceptedClientTemplate.PreviewProps = {
  customerFirstName: 'Ada',
  displayOrderId: '1042',
  poNumber: 'PO-1042',
  items: [
    { sku: 'CC-90E-150', title: '90° elbow, 1.5"', qty: 12 },
    { sku: 'CC-TC-200', title: 'Tri-clamp, 2"', qty: 4 },
  ],
  orderUrl: 'https://cardinalcoolingsystems.com/us/account/orders/order_123',
}
