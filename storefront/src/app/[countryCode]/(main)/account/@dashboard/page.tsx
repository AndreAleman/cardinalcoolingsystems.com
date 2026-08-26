import { Metadata } from "next"

import Overview from "@modules/account/components/overview"
import { notFound } from "next/navigation"
import { getCustomer } from "@lib/data/customer"
import { listOrders } from "@lib/data/orders"
import { getCompany } from "@lib/data/companies"
import DashboardShell from "@modules/account/components/dashboard-shell"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Order everything for your company from one page.",
}

export default async function OverviewTemplate() {
  const customer = await getCustomer().catch(() => null)
  const orders = (await listOrders().catch(() => null)) || null
  const membership = await getCompany()

  if (!customer) {
    notFound()
  }

  return (
    <DashboardShell membership={membership}>
      <Overview customer={customer} orders={orders} />
    </DashboardShell>
  )
}
