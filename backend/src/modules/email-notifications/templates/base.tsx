import { Html, Body, Container, Preview, Tailwind, Head, Section, Text } from '@react-email/components'
import * as React from 'react'

/** One line item on a Quote Request / Quote / order email — SKU + qty, no prices. */
export type EmailItem = {
  sku: string
  title: string | null
  qty: number
}

/** Itemized SKU + qty list shared by the quote/approval lifecycle emails. */
export const ItemList: React.FC<{ items: EmailItem[] }> = ({ items }) => (
  <Section className="bg-gray-100 rounded p-3 my-2">
    {items.length === 0 ? (
      <Text className="m-0 text-sm text-gray-600">No line items.</Text>
    ) : (
      items.map((item, i) => (
        <Text key={i} className="m-0 text-sm">
          <strong>{item.sku}</strong>
          {item.title ? ` — ${item.title}` : ''} × {item.qty}
        </Text>
      ))
    )}
  </Section>
)

interface BaseProps {
  preview?: string
  children: React.ReactNode
}

export const Base: React.FC<BaseProps> = ({ preview, children }) => {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px] w-full overflow-hidden">
            <div className="max-w-full break-words">
              {children}
            </div>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
