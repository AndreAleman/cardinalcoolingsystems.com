// Staff alert for CAD Requests, sent to CAD_REQUEST_INBOX_EMAIL (default
// aleman@cardinalcoolingsystems.com only; plan B7). One template, five kinds (ported from Sanitube):
//   review             CAD Review: the files are generated and wait for staff approval
//   new                a visitor got CAD files (review off only)
//   allowance_reached  a Business Email hit 10 CAD Requests in 30 days
//   queued             a request is waiting (site-wide daily cap reached)
//   failed             generating the files failed; the job retries
// `review: true` on a `queued` alert switches its copy to the review flow. No prices.

import { Button, Heading, Section, Text } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { CadConfigurationTable, isCadConfigurationRows, type CadConfigurationRow } from './cad-request-rows'

export const CAD_REQUEST_ALERT = 'cad-request-alert'

export type CadRequestAlertKind = 'new' | 'allowance_reached' | 'queued' | 'failed' | 'review'

export interface CadRequestAlertProps {
  kind: CadRequestAlertKind
  reference: string // "CAD-12"
  builderTitle?: string // "Transition Spool"
  contactName?: string
  companyName?: string
  email?: string
  isCustomer?: boolean // logged-in customer
  existingCustomer?: boolean // a visitor email that matches a customer account
  partNumber: string
  description?: string
  configuration: CadConfigurationRow[]
  clientIp?: string
  ipSource?: string
  sourcePage?: string
  emailRequests30d?: { used: number; limit: number }
  generationsToday?: { used: number; cap: number }
  error?: string
  attempts?: number
  reviewUrl: string // BACKEND_URL + '/app/cad-requests/' + id
  releaseUrl?: string // queued only
  review?: boolean // queued only: CAD Review is on
  preview?: string
}

export const isCadRequestAlertData = (data: any): data is CadRequestAlertProps =>
  typeof data?.kind === 'string' &&
  typeof data?.reference === 'string' &&
  typeof data?.reviewUrl === 'string' &&
  isCadConfigurationRows(data?.configuration)

export function cadAlertSubject(p: Pick<CadRequestAlertProps, 'kind' | 'reference' | 'companyName' | 'email' | 'partNumber'>): string {
  const who = p.companyName || p.email || 'unknown'
  switch (p.kind) {
    case 'new':
      return `New CAD Request ${p.reference} — ${who}`
    case 'allowance_reached':
      return `CAD Allowance reached — ${p.email || who}`
    case 'queued':
      return `CAD Request ${p.reference} queued — ${who}`
    case 'failed':
      return `CAD Request ${p.reference} failed — ${p.partNumber}`
    case 'review':
      return `CAD Request awaiting review: ${p.partNumber} — ${who}`
  }
}

function headline(p: CadRequestAlertProps): string {
  switch (p.kind) {
    case 'new':
      return `New CAD Request ${p.reference}`
    case 'allowance_reached':
      return 'CAD Allowance reached'
    case 'queued':
      return `CAD Request ${p.reference} is queued`
    case 'failed':
      return `CAD Request ${p.reference} failed`
    case 'review':
      return `CAD Request ${p.reference} is awaiting review`
  }
}

function intro(p: CadRequestAlertProps): React.ReactNode {
  const who = (
    <>
      <strong>{p.contactName || p.email || 'Someone'}</strong>
      {p.companyName ? (
        <>
          {' '}at <strong>{p.companyName}</strong>
        </>
      ) : null}
    </>
  )
  const what = p.builderTitle ? ` for a ${p.builderTitle}` : ''
  switch (p.kind) {
    case 'new':
      return <>{who} requested CAD files{what}, and we emailed them the download link.</>
    case 'allowance_reached':
      return (
        <>
          {who} has reached the limit of {p.emailRequests30d?.limit ?? 10} CAD Requests in 30 days, so their latest request was
          blocked. They were told our engineering team would be in touch.
        </>
      )
    case 'queued':
      if (p.review) {
        return (
          <>
            {who} requested CAD files{what} for a new configuration, but today&apos;s limit of new CAD generations is used up.
            They were told our engineering team reviews every CAD drawing and the link normally arrives within 1 business day.
            The files will be generated automatically at 9:00 Eastern on the next business day and then wait for your review, or
            you can generate them now.
          </>
        )
      }
      return (
        <>
          {who} requested CAD files{what} for a new configuration, but today&apos;s limit of new CAD generations is used up. They
          were told the files will arrive within 1 business day. It will be sent automatically at 9:00 Eastern on the next
          business day, or you can release it now.
        </>
      )
    case 'failed':
      return (
        <>
          We couldn&apos;t generate the CAD files{what} for {who}. The requester hasn&apos;t been told anything yet. We&apos;ll
          retry automatically every hour (up to 3 attempts), or you can retry from admin.
        </>
      )
    case 'review':
      return (
        <>
          {who} requested CAD files{what}. The files are generated and waiting for your review. Nothing has been sent yet: check
          the drawing, then approve to email the download link, or reject the request.
        </>
      )
  }
}

export const CadRequestAlertTemplate: React.FC<CadRequestAlertProps> & { PreviewProps?: CadRequestAlertProps } = (props) => (
  <Base preview={props.preview ?? cadAlertSubject(props)}>
    <Heading className="text-xl">{headline(props)}</Heading>
    <Text>
      {intro(props)}
      {props.isCustomer ? ' This is a logged-in customer.' : ''}
      {!props.isCustomer && props.existingCustomer ? ' This email belongs to an existing customer account.' : ''}
    </Text>
    <Text>
      {props.email ? (
        <>
          Email: <a href={`mailto:${props.email}`}>{props.email}</a>
          <br />
        </>
      ) : null}
      {props.clientIp ? (
        <>
          IP: {props.clientIp}
          {props.ipSource ? ` (${props.ipSource})` : ''}
          <br />
        </>
      ) : null}
      {props.sourcePage ? <span className="text-gray-600">Requested from: {props.sourcePage}</span> : null}
    </Text>
    <CadConfigurationTable partNumber={props.partNumber} description={props.description} rows={props.configuration} />
    {props.emailRequests30d || props.generationsToday ? (
      <Text>
        {props.emailRequests30d ? (
          <>
            CAD Requests from this email in 30 days: {props.emailRequests30d.used}/{props.emailRequests30d.limit}
            <br />
          </>
        ) : null}
        {props.generationsToday ? (
          <>
            New generations today: {props.generationsToday.used}/{props.generationsToday.cap}
          </>
        ) : null}
      </Text>
    ) : null}
    {props.kind === 'failed' && props.error ? (
      <Text>
        <span className="text-gray-600">Error{props.attempts ? ` (attempt ${props.attempts} of 3)` : ''}:</span>
        <br />
        {props.error}
      </Text>
    ) : null}
    <Section className="my-4">
      <Button href={props.reviewUrl} className="bg-black text-white px-5 py-3 rounded">
        {props.kind === 'review' ? 'Review files' : 'Review'}
      </Button>
      {props.kind === 'queued' && props.releaseUrl ? (
        <>
          {' '}
          <Button href={props.releaseUrl} className="bg-[#D72638] text-white px-5 py-3 rounded">
            {props.review ? 'Generate now' : 'Release now'}
          </Button>
        </>
      ) : null}
    </Section>
    <Text className="text-xs text-gray-500">Staff alert from cardinalcoolingsystems.com (CAD Requests).</Text>
  </Base>
)

CadRequestAlertTemplate.PreviewProps = {
  kind: 'review',
  reference: 'CAD-12',
  builderTitle: 'Transition Spool',
  contactName: 'Ada Lovelace',
  companyName: 'Acme CDU',
  email: 'ada@acme-cdu.com',
  partNumber: 'clmp-fl150-tspool-l12-6-200',
  description: '2" TRANSITION SPOOL 12" OAL TC X 150# FLG T316L',
  configuration: [{ label: 'End A', value: 'TRI-CLAMP FERRULE' }],
  reviewUrl: 'https://backend.cardinalcoolingsystems.com/app/cad-requests/cadr_1',
}

export default CadRequestAlertTemplate
