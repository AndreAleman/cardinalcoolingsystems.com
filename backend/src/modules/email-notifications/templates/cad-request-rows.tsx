// Configuration table shared by the CAD Request emails (link, queued/review notice, staff alert):
// the Part Number on top, then the builder's display rows. No prices: a CAD Request never carries
// one.

import { Section, Text } from '@react-email/components'
import * as React from 'react'

export type CadConfigurationRow = { label: string; value: string }

// The CAD Package is reference-only (spec: "certified drawing on quote approval").
export const CAD_REFERENCE_ONLY_NOTE =
  'These files are for reference only. Certified drawings come from Cardinal engineering once a quote is approved.'

export const isCadConfigurationRows = (rows: unknown): rows is CadConfigurationRow[] =>
  Array.isArray(rows) && rows.every((r) => typeof r?.label === 'string' && typeof r?.value === 'string')

export const CadConfigurationTable: React.FC<{
  partNumber: string
  description?: string
  rows: CadConfigurationRow[]
}> = ({ partNumber, description, rows }) => (
  <Section className="bg-gray-100 rounded p-3 my-2">
    <Text className="m-0 text-sm">
      <strong>Part Number:</strong> {partNumber}
    </Text>
    {description ? <Text className="m-0 text-xs text-gray-600">{description}</Text> : null}
    {rows.map((row, i) => (
      <Text key={i} className="m-0 text-sm">
        <span className="text-gray-600">{row.label}:</span> {row.value}
      </Text>
    ))}
  </Section>
)
