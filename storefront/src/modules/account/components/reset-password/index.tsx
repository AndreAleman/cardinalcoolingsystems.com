"use client"

import { useFormState } from "react-dom"

import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { resetPassword } from "@lib/data/customer"

type Props = {
  token: string
  email: string
}

/*
  New-password form for the emailed reset link. PUBLIC — it must work
  logged out, which is why the page lives at /{countryCode}/reset-password
  and not under the /account parallel-route gate. Success and failure
  are both PERSISTENT panels (portal convention, no toast).
*/
const ResetPasswordForm = ({ token, email }: Props) => {
  const [state, formAction] = useFormState(resetPassword, null)

  if (!token || !email) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="reset-password-incomplete"
      >
        <h1 className="text-large-semi uppercase mb-6">
          This link is incomplete
        </h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          The reset link you followed is missing some information — it may have
          been cut off by your email program. Please open the link straight
          from the email, or request a new one from the sign-in page.
        </p>
        <LocalizedClientLink
          href="/account"
          className="underline text-ui-fg-base text-small-regular"
        >
          Go to sign in
        </LocalizedClientLink>
      </div>
    )
  }

  if (state?.success) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="reset-password-success"
      >
        <h1 className="text-large-semi uppercase mb-6">Password updated</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          Password updated — sign in with your new password.
        </p>
        <LocalizedClientLink
          href="/account"
          className="w-full"
          data-testid="go-to-sign-in-link"
        >
          <span className="btn-ui flex items-center justify-center w-full rounded-md bg-black text-white px-6 py-3 text-base-semi">
            Sign in
          </span>
        </LocalizedClientLink>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="reset-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Set a new password</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Choose a new password for <strong>{email}</strong>.
      </p>
      <form className="w-full" action={formAction}>
        <input type="hidden" name="token" value={token} />
        <input type="hidden" name="email" value={email} />
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="New password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            data-testid="new-password-input"
          />
          <Input
            label="Confirm new password"
            name="confirm_password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            data-testid="confirm-password-input"
          />
        </div>
        <p className="text-small-regular text-ui-fg-subtle mt-2">
          At least 8 characters.
        </p>
        <ErrorMessage
          error={state?.error ?? null}
          data-testid="reset-password-error-message"
        />
        {state?.error && (
          <p className="text-small-regular text-ui-fg-base mt-2">
            Need a fresh link?{" "}
            <LocalizedClientLink href="/account" className="underline">
              Request a new reset email
            </LocalizedClientLink>{" "}
            from the sign-in page.
          </p>
        )}
        <SubmitButton
          data-testid="reset-password-button"
          className="w-full mt-6"
        >
          Set new password
        </SubmitButton>
      </form>
    </div>
  )
}

export default ResetPasswordForm
