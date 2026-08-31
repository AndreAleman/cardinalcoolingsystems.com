import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { getCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getCompany } from "@lib/data/companies"
import DashboardShell from "@modules/account/components/dashboard-shell"
import BuyerPortal from "@modules/account/components/buyer-portal"
import RequestPortalAccess from "@modules/account/components/request-portal-access"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Order everything for your company from one page.",
}

type Props = {
  params: { countryCode: string }
}

export default async function OverviewTemplate({ params }: Props) {
  const customer = await getCustomer().catch(() => null)
  const membership = await getCompany()

  if (!customer) {
    notFound()
  }

  // Approved Company → the one-page buyer portal. Everyone else
  // (retail customers, pending/declined Companies) keeps the classic
  // overview; DashboardShell shows the pending/declined screens itself.
  if (membership?.company.status === "approved") {
    return (
      <DashboardShell membership={membership}>
        <BuyerPortal membership={membership} countryCode={params.countryCode} />
      </DashboardShell>
    )
  }

  const orders = (await listOrders().catch(() => null)) || null

  return (
    <DashboardShell membership={membership}>
      {!membership && <RequestPortalAccess customer={customer} />}
      <Overview customer={customer} orders={orders} />
    </DashboardShell>
  )
}
