import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const COMPANY_INVITE = 'company-invite'

export interface CompanyInviteProps {
  company_name: string
  inviter_name: string
  accept_url: string
  expires_at: string
  preview?: string
}

export const isCompanyInviteData = (data: any): data is CompanyInviteProps =>
  typeof data?.company_name === 'string' && typeof data?.accept_url === 'string'

export const CompanyInviteTemplate: React.FC<CompanyInviteProps> & {
  PreviewProps?: CompanyInviteProps
} = ({ company_name, inviter_name, accept_url, expires_at, preview }) => {
  const until = new Date(expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return (
    <Base preview={preview ?? `${inviter_name} invited you to ${company_name}'s dashboard`}>
      <Heading className="text-xl">Join {company_name} on Cardinal</Heading>
      <Text>
        {inviter_name} invited you to {company_name}&apos;s company dashboard: order everything from one page, at your company&apos;s prices.
      </Text>
      <Section className="text-center my-4">
        <Button href={accept_url} className="bg-black text-white px-5 py-3 rounded">
          Accept invite
        </Button>
      </Section>
      <Text className="text-sm text-gray-600">This link works until {until}. If you weren&apos;t expecting it, ignore this email.</Text>
      <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
    </Base>
  )
}

CompanyInviteTemplate.PreviewProps = {
  company_name: 'Acme CDU',
  inviter_name: 'Ada Acme',
  accept_url: 'https://cardinalcoolingsystems.com/invite/abc123',
  expires_at: new Date(Date.now() + 7 * 864e5).toISOString(),
}
