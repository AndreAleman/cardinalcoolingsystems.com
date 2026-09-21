import { Text, Heading, Link } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const COMPANY_SIGNUP_ADMIN = 'company-signup-admin'

export interface CompanySignupAdminProps {
  company_id: string
  company_name: string
  email: string
  first_name: string
  /* 'approved' = Approved Domain, instant access; 'pending' = needs Cardinal. */
  status?: 'approved' | 'pending'
  /* True on the one email sent when the hourly signup-email cap is passed. */
  flood?: boolean
  preview?: string
}

export const isCompanySignupAdminData = (data: any): data is CompanySignupAdminProps =>
  typeof data?.company_id === 'string' && typeof data?.company_name === 'string'

export const CompanySignupAdminTemplate: React.FC<CompanySignupAdminProps> & {
  PreviewProps?: CompanySignupAdminProps
} = ({ company_id, company_name, email, first_name, status = 'pending', flood = false, preview }) => {
  const instant = status === 'approved'
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000'
  return (
    <Base preview={preview ?? (instant ? 'New company signup — auto-approved' : 'New company signup — needs your approval')}>
      <Heading className="text-xl">
        {instant ? 'New Company signed up (auto-approved)' : 'New Company needs your approval'}
      </Heading>
      <Text>
        <strong>{company_name}</strong> was created by {first_name || email} ({email}).{' '}
        {instant
          ? 'Their email domain is on your outreach list, so they have dashboard access already. Decline them in admin if this looks wrong.'
          : 'Their email domain is not on your outreach list. They cannot use the dashboard, and have been sent nothing, until you approve them.'}
      </Text>
      {flood && (
        <Text>
          <strong>Signup volume is unusually high.</strong> This is the last signup email for the next hour, so your inbox is not flooded. Every signup is still listed in Medusa Admin under Companies. If this looks like bots, decline them there.
        </Text>
      )}
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
