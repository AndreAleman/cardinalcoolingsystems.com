import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base, ItemList, EmailItem } from './base'

/*
  "Quote Request received" — to the customer immediately after they
  submit a Quote Request (sendQuoteClientEmailStep, template
  "quote-received"). Confirmation copy matches the order form's promise
  (pricing within 1 business day); itemized SKU + qty list, no prices;
  CTA to the quote detail page in their Dashboard.
*/

export const QUOTE_RECEIVED = 'quote-received'

export interface QuoteLifecycleClientProps {
  customerFirstName: string | null
  items: EmailItem[]
  quoteUrl: string
  poNumber: string | null
  preview?: string
}

export const isQuoteReceivedData = (data: any): data is QuoteLifecycleClientProps =>
  typeof data?.quoteUrl === 'string' && Array.isArray(data?.items)

export const QuoteReceivedTemplate: React.FC<QuoteLifecycleClientProps> & {
  PreviewProps?: QuoteLifecycleClientProps
} = ({ customerFirstName, items, quoteUrl, poNumber, preview }) => (
  <Base preview={preview ?? 'We received your Quote Request'}>
    <Heading className="text-xl">We received your Quote Request</Heading>
    <Text>Hi{customerFirstName ? ` ${customerFirstName}` : ''},</Text>
    <Text>
      Thanks — your Quote Request is in. Our team is pricing it now and you&apos;ll hear back
      within 1 business day.
    </Text>
    {poNumber && (
      <Text className="m-0 text-sm text-gray-600">
        PO number: <strong className="text-black">{poNumber}</strong>
      </Text>
    )}
    <Text className="mb-0 text-sm text-gray-600">Parts requested:</Text>
    <ItemList items={items} />
    <Section className="text-center my-4">
      <Button href={quoteUrl} className="bg-black text-white px-5 py-3 rounded">
        View your Quote Request
      </Button>
    </Section>
    <Text className="text-sm text-gray-600">
      Need to add or change something? Reply to this email or leave a note on the quote page.
    </Text>
    <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
  </Base>
)

QuoteReceivedTemplate.PreviewProps = {
  customerFirstName: 'Ada',
  items: [
    { sku: 'CC-90E-150', title: '90° elbow, 1.5"', qty: 12 },
    { sku: 'CC-TC-200', title: 'Tri-clamp, 2"', qty: 4 },
  ],
  quoteUrl: 'https://cardinalcoolingsystems.com/us/account/quotes/details/quote_123',
  poNumber: 'PO-1042',
}
