import { useState } from "react"
import { useFormState } from "react-dom"

import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { login, requestPasswordReset } from "@lib/data/customer"

type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

/*
  Forgot-password: one email field, and a PERSISTENT confirmation once
  submitted (portal convention — no toast). The copy never reveals
  whether the email has an account.
*/
const ForgotPassword = ({ onBack }: { onBack: () => void }) => {
  const [state, formAction] = useFormState(requestPasswordReset, null)

  if (state?.success) {
    return (
      <div
        className="max-w-sm w-full flex flex-col items-center"
        data-testid="forgot-password-confirmation"
      >
        <h1 className="text-large-semi uppercase mb-6">Check your inbox</h1>
        <p className="text-center text-base-regular text-ui-fg-base mb-8">
          If that email has an account, a reset link is on its way. Check your
          inbox.
        </p>
        <button
          onClick={onBack}
          className="underline text-ui-fg-base text-small-regular"
          data-testid="back-to-sign-in-button"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="forgot-password-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Forgot your password?</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Enter your email and we&apos;ll send you a link to set a new one.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="forgot-password-email-input"
          />
        </div>
        <ErrorMessage
          error={state?.error ?? null}
          data-testid="forgot-password-error-message"
        />
        <SubmitButton
          data-testid="send-reset-link-button"
          className="w-full mt-6"
        >
          Email me a reset link
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        Remembered it?{" "}
        <button onClick={onBack} className="underline">
          Back to sign in
        </button>
        .
      </span>
    </div>
  )
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useFormState(login, null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />
  }

  return (
    <div
      className="max-w-sm w-full flex flex-col items-center"
      data-testid="login-page"
    >
      <h1 className="text-large-semi uppercase mb-6">Welcome back</h1>
      <p className="text-center text-base-regular text-ui-fg-base mb-8">
        Sign in to access an enhanced shopping experience.
      </p>
      <form className="w-full" action={formAction}>
        <div className="flex flex-col w-full gap-y-2">
          <Input
            label="Email"
            name="email"
            type="email"
            title="Enter a valid email address."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <div className="w-full flex justify-end mt-2">
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="underline text-ui-fg-base text-small-regular"
            data-testid="forgot-password-button"
          >
            Forgot password?
          </button>
        </div>
        <ErrorMessage error={message} data-testid="login-error-message" />
        <SubmitButton data-testid="sign-in-button" className="w-full mt-6">
          Sign in
        </SubmitButton>
      </form>
      <span className="text-center text-ui-fg-base text-small-regular mt-6">
        New to Cardinal?{" "}
        <button
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="underline"
          data-testid="register-button"
        >
          Create an account
        </button>
        .
      </span>
    </div>
  )
}

export default Login
