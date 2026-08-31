"use client"

import { useFormState } from "react-dom"

import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { requestPortalAccess } from "@lib/data/companies"
import { HttpTypes } from "@medusajs/types"

type Props = {
  customer: HttpTypes.StoreCustomer | null
}

/*
  Shown on the account overview to a signed-in customer with no
  Company: their membership request never happened (or failed), so this
  card lets them send it without re-registering. On success the page
  re-renders into the Pending Company waiting screen.
*/
const RequestPortalAccess = ({ customer }: Props) => {
  const [message, formAction] = useFormState(requestPortalAccess, null)

  return (
    <div
      className="mb-8 p-6 border border-ui-border-base rounded-lg bg-ui-bg-subtle"
      data-testid="request-portal-access"
    >
      <h2 className="text-xl-semi mb-2">Request portal access</h2>
      <p className="text-base-regular text-ui-fg-base mb-4">
        Your account isn&apos;t linked to a company yet. Tell us who you buy
        for and we&apos;ll set up your company dashboard — Cardinal approves
        every account by hand, and we&apos;ll email you when you&apos;re in.
      </p>
      <form action={formAction} className="flex flex-col gap-y-2 max-w-sm">
        <Input
          label="Company name"
          name="company_name"
          required
          autoComplete="organization"
          data-testid="portal-company-name-input"
        />
        <Input
          label="Phone"
          name="phone"
          required
          type="tel"
          minLength={7}
          title="Enter a phone number with at least 7 digits."
          autoComplete="tel"
          defaultValue={customer?.phone ?? ""}
          data-testid="portal-phone-input"
        />
        <ErrorMessage error={message} data-testid="portal-access-error" />
        <SubmitButton
          className="w-full mt-2"
          data-testid="portal-access-button"
        >
          Request portal access
        </SubmitButton>
      </form>
    </div>
  )
}

export default RequestPortalAccess
