import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components"
import * as React from "react"

type ContactFormEmailProps = {
  name: string
  lastName: string
  email: string
  phone?: string
  message: string
}

function ContactFormEmailComponent({
  name,
  lastName,
  email,
  phone,
  message,
}: ContactFormEmailProps) {
  return (
    <Tailwind>
      <Html className="font-sans bg-gray-100">
        <Head />
        <Preview>New Contact Form Submission</Preview>
        <Body className="bg-white my-10 mx-auto w-full max-w-2xl">
          {/* Header */}
          <Section className="bg-[#27272a] text-white px-6 py-4">
            <Heading className="text-xl m-0">Contact Form Submission</Heading>
          </Section>

          {/* Content */}
          <Container className="p-6">
            <Heading className="text-2xl font-bold text-gray-800 mb-4">
              New Contact Request
            </Heading>

            <Section className="mb-4">
              <Text className="text-sm text-gray-600 mb-1 font-semibold">Name:</Text>
              <Text className="text-base text-gray-800 mt-0">
                {name} {lastName}
              </Text>
            </Section>

            <Section className="mb-4">
              <Text className="text-sm text-gray-600 mb-1 font-semibold">Email:</Text>
              <Text className="text-base text-gray-800 mt-0">{email}</Text>
            </Section>

            {phone && (
              <Section className="mb-4">
                <Text className="text-sm text-gray-600 mb-1 font-semibold">Phone:</Text>
                <Text className="text-base text-gray-800 mt-0">{phone}</Text>
              </Section>
            )}

            <Section className="mb-4">
              <Text className="text-sm text-gray-600 mb-1 font-semibold">Message:</Text>
              <Text className="text-base text-gray-800 mt-0 whitespace-pre-wrap">
                {message}
              </Text>
            </Section>
          </Container>

          {/* Footer */}
          <Section className="bg-gray-50 p-6 mt-10">
            <Text className="text-center text-gray-500 text-sm">
              This message was sent from your website's contact form.
            </Text>
          </Section>
        </Body>
      </Html>
    </Tailwind>
  )
}

export const contactFormEmail = (props: ContactFormEmailProps) => (
  <ContactFormEmailComponent {...props} />
)
