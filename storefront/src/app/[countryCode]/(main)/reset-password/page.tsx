import { Metadata } from "next"

import ResetPasswordForm from "@modules/account/components/reset-password"

/*
  PUBLIC reset-password page — target of the link in the
  `password-reset` email (backend/src/subscribers/customer-password-reset.ts
  builds `${STOREFRONT_URL}/us/reset-password?token=...&email=...`).

  It deliberately lives OUTSIDE /account: that route's parallel-route
  layout swaps @login/@dashboard on the signed-in customer, so a
  logged-out visitor could never reach a page nested there — and the
  whole point of this link is that the visitor cannot sign in.
*/

export const metadata: Metadata = {
  title: "Reset password",
  description: "Set a new password for your Cardinal Cooling Systems account.",
}

type Props = {
  searchParams: {
    token?: string
    email?: string
  }
}

export default function ResetPasswordPage({ searchParams }: Props) {
  const token = searchParams.token ?? ""
  const email = searchParams.email ?? ""

  return (
    <div className="w-full flex justify-center px-8 py-16">
      <ResetPasswordForm token={token} email={email} />
    </div>
  )
}
