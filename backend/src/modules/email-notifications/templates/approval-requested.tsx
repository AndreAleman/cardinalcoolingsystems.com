import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base, ItemList, EmailItem } from './base'

/*
  "Approval requested" — to the Company's admin + manager Team Members
  when a member submits a request that the approval gate held
  (notifyApprovalCreatedStep). Body: submitter + company, itemized
  SKU + qty list (no prices), CTA to the approvals queue in their
  Dashboard.
*/

export const APPROVAL_REQUESTED = 'approval-requested'

export interface ApprovalRequestedProps {
  submitterName: string
  companyName: string
  items: EmailItem[]
  reviewUrl: string
  preview?: string
}

export const isApprovalRequestedData = (data: any): data is ApprovalRequestedProps =>
  typeof data?.submitterName === 'string' &&
  typeof data?.reviewUrl === 'string' &&
  Array.isArray(data?.items)

export const ApprovalRequestedTemplate: React.FC<ApprovalRequestedProps> & {
  PreviewProps?: ApprovalRequestedProps
} = ({ submitterName, companyName, items, reviewUrl, preview }) => (
  <Base preview={preview ?? `${submitterName} submitted a request that needs your approval`}>
    <Heading className="text-xl">New request needs your approval</Heading>
    <Text>
      <strong>{submitterName}</strong> at <strong>{companyName}</strong> just submitted a
      request that requires manager or admin approval before it&apos;s sent to Cardinal.
    </Text>
    <Text className="mb-0 text-sm text-gray-600">Items requested:</Text>
    <ItemList items={items} />
    <Section className="text-center my-4">
      <Button href={reviewUrl} className="bg-black text-white px-5 py-3 rounded">
        Review the request
      </Button>
    </Section>
    <Text className="text-sm text-gray-600">
      You can approve or reject it from your Dashboard.
    </Text>
    <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
  </Base>
)

ApprovalRequestedTemplate.PreviewProps = {
  submitterName: 'Ada Acme',
  companyName: 'Acme CDU',
  items: [
    { sku: 'CC-90E-150', title: '90° elbow, 1.5"', qty: 12 },
    { sku: 'CC-TC-200', title: 'Tri-clamp, 2"', qty: 4 },
  ],
  reviewUrl: 'https://cardinalcoolingsystems.com/us/account',
}
