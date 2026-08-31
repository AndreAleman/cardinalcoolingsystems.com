import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

/*
  "PO uploaded" — to Cardinal whenever a Team Member drops a purchase
  order on the Dashboard (spec story 60: a bad read must never slip
  past quietly). Shows the read-out line by line — matched SKU or
  UNMATCHED, quantities, price alarms — and links to the original file.
*/

export const PO_UPLOADED = 'po-uploaded'

export interface PoUploadedLine {
  description: string
  quantity: number
  matched_sku: string | null
  price_alarm: boolean
}

export interface PoUploadedProps {
  submitterName: string
  companyName: string
  poNumber: string | null
  fileUrl: string | null
  lines: PoUploadedLine[]
  preview?: string
}

export const isPoUploadedData = (data: any): data is PoUploadedProps =>
  Array.isArray(data?.lines) && typeof data?.submitterName === 'string'

export const PoUploadedTemplate: React.FC<PoUploadedProps> & {
  PreviewProps?: PoUploadedProps
} = ({ submitterName, companyName, poNumber, fileUrl, lines, preview }) => (
  <Base preview={preview ?? 'A purchase order was uploaded'}>
    <Heading className="text-xl">PO uploaded to the Dashboard</Heading>
    <Text>
      {submitterName} ({companyName}) uploaded a purchase order
      {poNumber ? <> — PO <strong>{poNumber}</strong></> : null}. Here is what the
      reader made of it — check it against the original.
    </Text>
    <Section>
      {lines.map((line, index) => (
        <Text key={index} className="m-0 text-sm">
          {line.quantity}× {line.matched_sku ?? 'UNMATCHED'}
          {line.price_alarm ? ' ⚠ price alarm' : ''} — {line.description}
        </Text>
      ))}
    </Section>
    {fileUrl && (
      <Section className="mt-4">
        <Button
          href={fileUrl}
          className="bg-black text-white px-4 py-2 rounded"
        >
          Open the original document
        </Button>
      </Section>
    )}
  </Base>
)

PoUploadedTemplate.PreviewProps = {
  submitterName: 'Claire Olsen',
  companyName: 'Empirical Foods',
  poNumber: 'PO0437232-2',
  fileUrl: 'https://example.com/po.pdf',
  lines: [
    {
      description: "RDCR CONC 2.00X1.50 BW TUBE S&O'B 31W-2X15-7-304",
      quantity: 4,
      matched_sku: '31W-2X15-7-304',
      price_alarm: true,
    },
    {
      description: 'MYSTERY BRACKET 9999-XYZ',
      quantity: 1,
      matched_sku: null,
      price_alarm: false,
    },
  ],
}
