"use client"

import { useFormState } from "react-dom"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { acceptInviteSignup } from "@lib/data/customer"
import { InvitePreview } from "@lib/data/companies"

type Props = { token: string; invite: InvitePreview; signedIn: boolean; signedInEmail?: string | null }

const InviteAccept = ({ token, invite, signedIn, signedInEmail }: Props) => {
  const [message, formAction] = useFormState(acceptInviteSignup, null)
  return (
    <div className="max-w-sm mx-auto flex flex-col gap-4 py-12" data-testid="invite-accept">
      <h1 className="text-xl-semi m-0">Join {invite.company_name}</h1>
      <p className="text-base-regular text-ui-fg-base m-0">
        {signedIn
          ? `You're signed in as ${signedInEmail}. Accept to join ${invite.company_name}'s dashboard.`
          : `This invite is for ${invite.email}. Enter a password — your existing one if you already have an account, or a new one.`}
      </p>
      <form action={formAction} className="flex flex-col gap-2">
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={invite.email} />
        {!signedIn && (
          <>
            <Input label="First name" name="first_name" required autoComplete="given-name" />
            <Input label="Last name" name="last_name" required autoComplete="family-name" />
            <Input label="Email" name="email_display" type="email" value={invite.email} disabled />
            <Input label="Password" name="password" type="password" required autoComplete="current-password" />
          </>
        )}
        <ErrorMessage error={message} data-testid="invite-accept-error" />
        {signedIn && signedInEmail?.toLowerCase() !== invite.email.toLowerCase() && (
          <p className="text-small-regular text-ui-fg-subtle m-0">
            This invite was sent to {invite.email}. Sign out and open the link again to accept it as that person.
          </p>
        )}
        <SubmitButton className="w-full mt-2" data-testid="accept-invite-button">
          {signedIn ? "Accept invite" : "Create account & join"}
        </SubmitButton>
      </form>
    </div>
  )
}

export default InviteAccept
