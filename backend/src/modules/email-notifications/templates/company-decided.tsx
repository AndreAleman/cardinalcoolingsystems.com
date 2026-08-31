import { Text, Heading, Link } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const COMPANY_DECIDED = 'company-decided'

export interface CompanyDecidedProps {
  first_name: string
  company_name: string
  status: 'approved' | 'declined'
  preview?: string
}

export const isCompanyDecidedData = (data: any): data is CompanyDecidedProps =>
  typeof data?.company_name === 'string' && (data?.status === 'approved' || data?.status === 'declined')

export const CompanyDecidedTemplate: React.FC<CompanyDecidedProps> & {
  PreviewProps?: CompanyDecidedProps
} = ({ first_name, company_name, status, preview }) => {
  const storefrontUrl = process.env.STOREFRONT_URL || 'https://cardinalcoolingsystems.com'
  const approved = status === 'approved'
  return (
    <Base preview={preview ?? (approved ? 'Your company dashboard is unlocked' : 'About your company account')}>
      <Heading className="text-xl">
        {approved ? `${company_name} is approved` : `About ${company_name}`}
      </Heading>
      {approved ? (
        <>
          <Text>Hi{first_name ? ` ${first_name}` : ''} — your company dashboard is unlocked. Order everything from one page, at your company&apos;s prices.</Text>
          <Text><Link href={`${storefrontUrl}/account`}>Open your dashboard</Link></Text>
        </>
      ) : (
        <Text>Hi{first_name ? ` ${first_name}` : ''} — we couldn&apos;t approve a company dashboard for {company_name} right now. You can still order from the site as usual. Reply to this email if you think this is a mistake.</Text>
      )}
      <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
    </Base>
  )
}

CompanyDecidedTemplate.PreviewProps = {
  first_name: 'Ada',
  company_name: 'Acme CDU',
  status: 'approved',
}
