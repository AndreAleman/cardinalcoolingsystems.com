"use client"

import React, { useEffect } from "react"

import Input from "@modules/common/components/input"

import AccountInfo from "../account-info"
import { useFormState } from "react-dom"
import { HttpTypes } from "@medusajs/types"

type MyInformationProps = {
  customer: HttpTypes.StoreCustomer
}

const ProfileName: React.FC<MyInformationProps> = ({ customer }) => {
  const [successState, setSuccessState] = React.useState(false)

  // Self-service password change isn't wired up yet (Medusa requires the
  // auth reset-token flow). The previous action was a no-op that returned
  // `undefined`, which made `state` undefined on submit and crashed this page
  // when reading `state.error`. Return a well-formed state with an honest
  // message instead, so the form degrades gracefully.
  const updatePassword = (
    _currentState: Record<string, unknown>,
    _formData: FormData
  ) => ({
    customer,
    success: false,
    error:
      "Password changes aren't available here yet. Use “Forgot password” on the sign-in page, or contact aleman@cardinalcoolingsystems.com.",
  })

  const [state, formAction] = useFormState(updatePassword as any, {
    customer,
    success: false,
    error: null,
  })

  const clearState = () => {
    setSuccessState(false)
  }

  useEffect(() => {
    setSuccessState(state.success)
  }, [state])

  return (
    <form action={formAction} onReset={() => clearState()} className="w-full">
      <AccountInfo
        label="Password"
        currentInfo={
          <span>The password is not shown for security reasons</span>
        }
        isSuccess={successState}
        isError={!!state.error}
        errorMessage={state.error ?? undefined}
        clearState={clearState}
        data-testid="account-password-editor"
      >
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Old password"
            name="old_password"
            required
            type="password"
            data-testid="old-password-input"
          />
          <Input
            label="New password"
            type="password"
            name="new_password"
            required
            data-testid="new-password-input"
          />
          <Input
            label="Confirm password"
            type="password"
            name="confirm_password"
            required
            data-testid="confirm-password-input"
          />
        </div>
      </AccountInfo>
    </form>
  )
}

export default ProfileName
