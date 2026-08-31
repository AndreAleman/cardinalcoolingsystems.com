import { Metadata } from "next"
import { getInvite } from "@lib/data/companies"
import { getCustomer } from "@lib/data/customer"
import InviteAccept from "@modules/account/components/invite-accept"

export const metadata: Metadata = {
  title: "Join your company dashboard",
  description: "Accept your invite to order from one page.",
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const [invite, customer] = await Promise.all([
    getInvite(params.token),
    getCustomer().catch(() => null),
  ])

  if (!invite) {
    return (
      <div className="content-container py-12 max-w-sm mx-auto" data-testid="invite-invalid">
        <h1 className="text-xl-semi mb-2">This invite link isn&apos;t valid</h1>
        <p className="text-base-regular m-0">It may have expired or already been used. Ask your coworker to send a new one.</p>
      </div>
    )
  }

  return (
    <div className="content-container">
      <InviteAccept token={params.token} invite={invite} signedIn={!!customer} signedInEmail={customer?.email} />
    </div>
  )
}
