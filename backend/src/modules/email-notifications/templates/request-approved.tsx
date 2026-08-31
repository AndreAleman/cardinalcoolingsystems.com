import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base, ItemList, EmailItem } from './base'

/*
  "Request approved" — to the original submitter when a manager or
  admin approves their held request (notifyApprovalDecidedStep). The
  request resumes its original pipeline (Quote Request or order), so
  the copy points them back at their Dashboard to follow it.
*/

export const REQUEST_APPROVED = 'request-approved'

export interface RequestDecidedProps {
  buyerFirstName: string | null
  approverName: string | null
  items: EmailItem[]
  ctaHref: string
  ctaLabel: string
  preview?: string
}

export const isRequestApprovedData = (data: any): data is RequestDecidedProps =>
  typeof data?.ctaHref === 'string' && Array.isArray(data?.items)

export const RequestApprovedTemplate: React.FC<RequestDecidedProps> & {
  PreviewProps?: RequestDecidedProps
} = ({ buyerFirstName, approverName, items, ctaHref, ctaLabel, preview }) => (
  <Base preview={preview ?? 'Your request was approved'}>
    <Heading className="text-xl text-green-700">Your request was approved</Heading>
    <Text>Hi{buyerFirstName ? ` ${buyerFirstName}` : ''},</Text>
    <Text>{approverName ? `${approverName} approved your request.` : 'Your request was approved.'}</Text>
    <Text>
      It&apos;s on its way to Cardinal now — we&apos;ll follow up with pricing or order
      details. You can track it from your Dashboard.
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

RequestApprovedTemplate.PreviewProps = {
  buyerFirstName: 'Ada',
  approverName: 'Grace Acme',
  items: [
    { sku: 'CC-90E-150', title: '90° elbow, 1.5"', qty: 12 },
    { sku: 'CC-TC-200', title: 'Tri-clamp, 2"', qty: 4 },
  ],
  ctaHref: 'https://cardinalcoolingsystems.com/us/account',
  ctaLabel: 'Open your Dashboard',
}
