import { Text, Section, Heading } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { WELCOME_CODE_PERCENT } from '../../../utils/welcome-code'

export const COMPANY_WELCOME = 'company-welcome'

export interface CompanyWelcomeProps {
  first_name: string
  company_name: string
  welcome_code: string
  ends_at: string
  preview?: string
}

export const isCompanyWelcomeData = (data: any): data is CompanyWelcomeProps =>
  typeof data?.company_name === 'string' && typeof data?.welcome_code === 'string'

export const CompanyWelcomeTemplate: React.FC<CompanyWelcomeProps> & {
  PreviewProps?: CompanyWelcomeProps
} = ({ first_name, company_name, welcome_code, ends_at, preview = `Your ${WELCOME_CODE_PERCENT}% welcome code` }) => {
  const until = new Date(ends_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
  return (
    <Base preview={preview}>
      <Heading className="text-xl">Welcome{first_name ? `, ${first_name}` : ''}</Heading>
      <Text>
        Your company account for <strong>{company_name}</strong> is set up. We are reviewing it now and will email you the moment your Dashboard is unlocked.
      </Text>
      <Section className="bg-gray-100 rounded p-4 text-center my-4">
        <Text className="m-0 text-sm text-gray-600">Your welcome code — {WELCOME_CODE_PERCENT}% off your first order</Text>
        <Text className="m-0 text-2xl font-bold tracking-wider">{welcome_code}</Text>
        <Text className="m-0 text-sm text-gray-600">Works once, any order size, until {until}.</Text>
      </Section>
      <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
    </Base>
  )
}

CompanyWelcomeTemplate.PreviewProps = {
  first_name: 'Ada',
  company_name: 'Acme CDU',
  welcome_code: 'WELCOME-7K2M9X',
  ends_at: new Date(Date.now() + 30 * 864e5).toISOString(),
}
