import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base, ItemList } from './base'
import type { RequestDecidedProps } from './request-approved'

/*
  "Request rejected" — to the original submitter when a manager or
  admin rejects their held request (notifyApprovalDecidedStep). Shares
  the RequestDecidedProps shape with request-approved; separate
  template keys keep call sites and Resend's log labels readable.
*/

export const REQUEST_REJECTED = 'request-rejected'

export const isRequestRejectedData = (data: any): data is RequestDecidedProps =>
  typeof data?.ctaHref === 'string' && Array.isArray(data?.items)

export const RequestRejectedTemplate: React.FC<RequestDecidedProps> & {
  PreviewProps?: RequestDecidedProps
} = ({ buyerFirstName, approverName, items, ctaHref, ctaLabel, preview }) => (
  <Base preview={preview ?? 'Your request was rejected'}>
    <Heading className="text-xl text-red-700">Your request was rejected</Heading>
    <Text>Hi{buyerFirstName ? ` ${buyerFirstName}` : ''},</Text>
    <Text>{approverName ? `${approverName} rejected your request.` : 'Your request was rejected.'}</Text>
    <Text>
      If this was a mistake, contact your manager or submit a new request from your Dashboard.
    </Text>
    <Text className="mb-0 text-sm text-gray-600">Items in your request:</Text>
    <ItemList items={items} />
    <Section className="text-center my-4">
      <Button href={ctaHref} className="bg-black text-white px-5 py-3 rounded">
        {ctaLabel}
      </Button>
    </Section>
    <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
  </Base>
)

RequestRejectedTemplate.PreviewProps = {
  buyerFirstName: 'Ada',
  approverName: 'Grace Acme',
  items: [
    { sku: 'CC-90E-150', title: '90° elbow, 1.5"', qty: 12 },
    { sku: 'CC-TC-200', title: 'Tri-clamp, 2"', qty: 4 },
  ],
  ctaHref: 'https://cardinalcoolingsystems.com/us/account',
  ctaLabel: 'Open your Dashboard',
}
