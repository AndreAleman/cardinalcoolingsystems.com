import { Text, Heading, Button, Section } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

/*
  "Reset your password" — to a customer right after they ask for a
  reset link (customer-password-reset subscriber, event
  auth.password_reset). One big button to the storefront reset page;
  the link is short-lived and ignoring the email is always safe.
*/

export const PASSWORD_RESET = 'password-reset'

export interface PasswordResetProps {
  resetUrl: string
  preview?: string
}

export const isPasswordResetData = (data: any): data is PasswordResetProps =>
  typeof data?.resetUrl === 'string'

export const PasswordResetTemplate: React.FC<PasswordResetProps> & {
  PreviewProps?: PasswordResetProps
} = ({ resetUrl, preview }) => (
  <Base preview={preview ?? 'Set a new password for your Cardinal account'}>
    <Heading className="text-xl">Reset your password</Heading>
    <Text>Hi,</Text>
    <Text>
      Someone asked to reset the password for your Cardinal Cooling Systems account. Click the
      button below to choose a new one.
    </Text>
    <Section className="text-center my-4">
      <Button href={resetUrl} className="bg-black text-white px-5 py-3 rounded">
        Set a new password
      </Button>
    </Section>
    <Text className="text-sm text-gray-600">
      This link expires soon. If it has stopped working, just request a new one from the sign-in
      page.
    </Text>
    <Text className="text-sm text-gray-600">
      Didn&apos;t ask for this? You can safely ignore this email — your password stays the same.
    </Text>
    <Text className="text-sm text-gray-600">Cardinal Cooling Systems</Text>
  </Base>
)

PasswordResetTemplate.PreviewProps = {
  resetUrl:
    'https://cardinalcoolingsystems.com/us/reset-password?token=abc123&email=ada%40example.com',
}
