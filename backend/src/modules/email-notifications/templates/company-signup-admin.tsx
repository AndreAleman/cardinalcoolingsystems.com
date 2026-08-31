import { Text, Heading, Link } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const COMPANY_SIGNUP_ADMIN = 'company-signup-admin'

export interface CompanySignupAdminProps {
  company_id: string
  company_name: string
  email: string
  first_name: string
  preview?: string
}

export const isCompanySignupAdminData = (data: any): data is CompanySignupAdminProps =>
  typeof data?.company_id === 'string' && typeof data?.company_name === 'string'

export const CompanySignupAdminTemplate: React.FC<CompanySignupAdminProps> & {
  PreviewProps?: CompanySignupAdminProps
} = ({ company_id, company_name, email, first_name, preview = 'New company signup — approve it' }) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000'
  return (
    <Base preview={preview}>
      <Heading className="text-xl">New Company signed up</Heading>
      <Text>
        <strong>{company_name}</strong> was created by {first_name || email} ({email}). It is pending until you approve it.
      </Text>
      <Text>
        <Link href={`${backendUrl}/app/companies/${company_id}`}>Open it in Medusa Admin</Link>
      </Text>
    </Base>
  )
}

CompanySignupAdminTemplate.PreviewProps = {
  company_id: 'comp_123',
  company_name: 'Acme CDU',
  email: 'ada@acme.test',
  first_name: 'Ada',
}
