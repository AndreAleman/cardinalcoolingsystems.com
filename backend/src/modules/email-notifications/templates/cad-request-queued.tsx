// Sent to the requester when their CAD Request is Queued (the site-wide daily generation cap was
// reached) or, with CAD Review on (plan B7), when it enters review: Cardinal's engineering team
// reviews every CAD drawing and the link follows, normally within 1 business day. 1 h cooldown per
// email (subscriber).

import { Heading, Text } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { CadConfigurationTable, isCadConfigurationRows, type CadConfigurationRow } from './cad-request-rows'

export const CAD_REQUEST_QUEUED = 'cad-request-queued'

export interface CadRequestQueuedProps {
  reference: string
  contactName?: string
  partNumber: string
  description: string
  configuration: CadConfigurationRow[]
  review?: boolean
  preview?: string
}

export const isCadRequestQueuedData = (data: any): data is CadRequestQueuedProps =>
  typeof data?.reference === 'string' && typeof data?.partNumber === 'string' && isCadConfigurationRows(data?.configuration)

export const cadRequestQueuedSubject = (p: Pick<CadRequestQueuedProps, 'partNumber'>) =>
  `We're preparing your CAD files for ${p.partNumber}`

export const CadRequestQueuedTemplate: React.FC<CadRequestQueuedProps> & { PreviewProps?: CadRequestQueuedProps } = (props) => (
  <Base preview={props.preview ?? `We're preparing your CAD files for ${props.partNumber}`}>
    <Heading className="text-xl">We&apos;re preparing your CAD files</Heading>
    <Text>Hi {props.contactName || 'there'},</Text>
    <Text>
      Thanks for your CAD request. Your reference is <strong>{props.reference}</strong>.
    </Text>
    <CadConfigurationTable partNumber={props.partNumber} description={props.description} rows={props.configuration} />
    {props.review ? (
      <Text>
        Cardinal&apos;s engineering team reviews every CAD drawing before release. We&apos;ll email you the download link once
        it&apos;s approved, normally within 1 business day. No action is needed from you in the meantime.
      </Text>
    ) : (
      <Text>You&apos;ll get the download link within 1 business day. No action is needed from you in the meantime.</Text>
    )}
    <Text className="text-xs text-gray-500">You&apos;re receiving this because you requested CAD files at cardinalcoolingsystems.com.</Text>
  </Base>
)

CadRequestQueuedTemplate.PreviewProps = {
  reference: 'CAD-12',
  contactName: 'Ada',
  partNumber: 'clmp-clmp-rman-n12-d100clmp-p24-6-400',
  description: '4" ROW MANIFOLD 12 X 1" TC DROPS @ 24" TC ENDS T316L',
  configuration: [{ label: 'Header OD', value: '4"' }],
  review: true,
}

export default CadRequestQueuedTemplate
