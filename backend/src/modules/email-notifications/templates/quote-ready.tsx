import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base, ItemList } from './base'
import type { QuoteLifecycleClientProps } from './quote-received'

/*
  "Your Quote is ready" — to the customer when Cardinal prices a Quote
  and sends it back (sendQuoteClientEmailStep, template "quote-ready").

  Fires on EVERY send, including re-sends after revisions following a
  rejection or change request — so this email doubles as the "your
  Quote was updated" notice; the copy reads correctly in both cases.
  No prices in the email — pricing lives on the Dashboard quote page.
*/

export const QUOTE_READY = 'quote-ready'

export const isQuoteReadyData = (data: any): data is QuoteLifecycleClientProps =>
  typeof data?.quoteUrl === 'string' && Array.isArray(data?.items)

export const QuoteReadyTemplate: React.FC<QuoteLifecycleClientProps> & {
  PreviewProps?: QuoteLifecycleClientProps
} = ({ customerFirstName, items, quoteUrl, poNumber, preview }) => (
  <Base preview={preview ?? 'Your Quote is ready to review'}>
    <Heading className="text-xl">Your Quote is ready to review</Heading>
    <Text>Hi{customerFirstName ? ` ${customerFirstName}` : ''},</Text>
    <Text>
      Our team has priced your Quote and it&apos;s ready for you. Review the pricing on your
      quote page, where you can accept it, request changes, or leave us a note.
    </Text>
    {poNumber && (
      <Text className="m-0 text-sm text-gray-600">
        PO number: <strong className="text-black">{poNumber}</strong>
      </Text>
    )}
    <Text className="mb-0 text-sm text-gray-600">Parts on this Quote:</Text>
    <ItemList items={items} />
    <Section className="text-center my-4">
      <Button href={quoteUrl} className="bg-black text-white px-5 py-3 rounded">
        Review your Quote
      </Button>
    </Section>
    <Text className="text-sm text-gray-600">
      If anything looks off, reply to this email or request changes right on the quote page —
      we&apos;ll take another pass.
    </Text>
    <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
  </Base>
)

QuoteReadyTemplate.PreviewProps = {
  customerFirstName: 'Ada',
  items: [
    { sku: 'CC-90E-150', title: '90° elbow, 1.5"', qty: 12 },
    { sku: 'CC-TC-200', title: 'Tri-clamp, 2"', qty: 4 },
  ],
  quoteUrl: 'https://cardinalcoolingsystems.com/us/account/quotes/details/quote_123',
  poNumber: 'PO-1042',
}
