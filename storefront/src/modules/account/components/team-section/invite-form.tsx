"use client"

import { useFormState } from "react-dom"
import Input from "@modules/common/components/input"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { inviteTeamMember } from "@lib/data/companies"

const InviteForm = () => {
  const [message, formAction] = useFormState(inviteTeamMember, null)
  return (
    <form action={formAction} className="flex flex-col small:flex-row gap-2 items-start" data-testid="invite-form">
      <div className="flex-1 w-full">
        <Input label="Coworker's email" name="email" type="email" required autoComplete="off" data-testid="invite-email-input" />
        <ErrorMessage error={message} data-testid="invite-error" />
      </div>
      <SubmitButton className="whitespace-nowrap" data-testid="invite-button">Send invite</SubmitButton>
    </form>
  )
}

export default InviteForm
