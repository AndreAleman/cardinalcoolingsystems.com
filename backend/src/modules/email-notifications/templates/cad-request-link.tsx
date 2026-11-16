// Sent to the requester with the download link for their CAD Package, after staff approve it (CAD
// Review, plan B7) or right away with review off. The link is the product, and emailing it is what
// verifies the address. PDF-only builders (CDU Hookup Kit, Strainer, Hose; plan B8) say so.

import { Button, Heading, Section, Text } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { CAD_REFERENCE_ONLY_NOTE, CadConfigurationTable, isCadConfigurationRows, type CadConfigurationRow } from './cad-request-rows'

export const CAD_REQUEST_LINK = 'cad-request-link'

export interface CadRequestLinkProps {
  reference: string // "CAD-12"
  contactName?: string // first name; omitted → "Hi there"
  partNumber: string
  description: string
  configuration: CadConfigurationRow[]
  downloadUrl: string // STOREFRONT_URL + '/us/cad/download/' + token
  quoteUrl?: string // Share Link back to the builder, to request a quote
  validDays?: number // default 7
  hasStep?: boolean // default true; false = PDF only
  preview?: string
}

export const isCadRequestLinkData = (data: any): data is CadRequestLinkProps =>
  typeof data?.reference === 'string' &&
  typeof data?.partNumber === 'string' &&
  typeof data?.downloadUrl === 'string' &&
  isCadConfigurationRows(data?.configuration)

export const cadRequestLinkSubject = (p: Pick<CadRequestLinkProps, 'partNumber'>) => `Your CAD files for ${p.partNumber}`

export const CadRequestLinkTemplate: React.FC<CadRequestLinkProps> & { PreviewProps?: CadRequestLinkProps } = (props) => {
  const days = props.validDays ?? 7
  const hasStep = props.hasStep !== false
  return (
    <Base preview={props.preview ?? `Your CAD files for ${props.partNumber} are ready to download`}>
      <Heading className="text-xl">Your CAD files for {props.partNumber}</Heading>
      <Text>Hi {props.contactName || 'there'},</Text>
      <Text>
        {hasStep
          ? 'Your CAD files are ready: a 3D STEP model and a PDF drawing.'
          : 'Your CAD files are ready: a PDF drawing with the bill of materials. This is a kit of stocked parts, so there is no single STEP model; STEP files for the stocked parts are available on request.'}{' '}
        Your reference is <strong>{props.reference}</strong>.
      </Text>
      <CadConfigurationTable partNumber={props.partNumber} description={props.description} rows={props.configuration} />
      <Section className="my-4">
        <Button href={props.downloadUrl} className="bg-[#D72638] text-white px-4 py-2 rounded text-sm">
          Download CAD files
        </Button>
      </Section>
      <Text className="text-xs text-gray-600">The link works for {days} days.</Text>
      <Text className="text-xs text-gray-600">{CAD_REFERENCE_ONLY_NOTE}</Text>
      {props.quoteUrl ? (
        <Text>
          Need pricing? <a href={props.quoteUrl}>Request a quote</a> for this configuration. Cardinal sends a firm quote
          within 1 business day.
        </Text>
      ) : null}
      <Text className="text-xs text-gray-500">You&apos;re receiving this because you requested CAD files at cardinalcoolingsystems.com.</Text>
    </Base>
  )
}

CadRequestLinkTemplate.PreviewProps = {
  reference: 'CAD-12',
  contactName: 'Ada',
  partNumber: 'clmp-fl150-tspool-l12-6-200',
  description: '2" TRANSITION SPOOL 12" OAL TC X 150# FLG T316L',
  configuration: [
    { label: 'End A', value: 'TRI-CLAMP FERRULE' },
    { label: 'End B', value: '150# RF FLANGE' },
  ],
  downloadUrl: 'https://cardinalcoolingsystems.com/us/cad/download/abc',
  quoteUrl: 'https://cardinalcoolingsystems.com/us/build/transition?v=1',
}

export default CadRequestLinkTemplate
