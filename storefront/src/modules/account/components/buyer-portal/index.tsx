/*
  Buyer Portal — the approved Company's one-page Dashboard body, stacked
  in reading order: Quick Order at the top, then Approvals (when the
  signed-in person can decide), Quotes, Orders / Order Again. The Team
  section is appended by DashboardShell.

  Server component: fetches everything up front and hands plain props to
  the client sections, which share one draft order via PortalCartProvider.
*/

import { HttpTypes } from "@medusajs/types"
import { getCustomer } from "@lib/data/customer"
import type { CompanyMembership } from "@lib/data/companies"
import {
  getAssignedLocationId,
  getDashboard,
  getDashboardLocations,
  getDashboardOrders,
  listApprovals,
  listFavorites,
} from "@lib/data/dashboard"
import {
  getPortalProductsByVariantIds,
  searchPortalProducts,
} from "@lib/data/order-form"
import { fetchQuotes } from "@lib/data/quotes"
import { PortalCartProvider } from "@lib/context/portal-cart-context"
import QuickOrder from "../quick-order"
import {
  buildVariantRowMap,
  type VariantRow,
} from "../quick-order/variant-info"
import QuotesSection from "../quotes-section"
import OrdersSection from "../orders-section"
import ApprovalsSection from "../approvals-section"

type Props = {
  membership: CompanyMembership
  countryCode: string
}

const BuyerPortal = async ({ membership, countryCode }: Props) => {
  const [
    dashboard,
    initialProducts,
    orders,
    quotes,
    approvals,
    favorites,
    customer,
    locations,
    assignedLocationId,
  ] = await Promise.all([
    getDashboard(),
    searchPortalProducts({ countryCode }).catch(
      () => [] as HttpTypes.StoreProduct[]
    ),
    getDashboardOrders(),
    fetchQuotes(),
    listApprovals(),
    listFavorites(),
    getCustomer().catch(() => null),
    getDashboardLocations(),
    getAssignedLocationId(),
  ])

  const role = dashboard?.role ?? membership.role
  const invoicePaymentEnabled = Boolean(
    dashboard?.company?.invoice_payment_enabled
  )
  const currencyCode =
    dashboard?.company?.currency_code ??
    membership.company.currency_code ??
    "usd"

  // Live variant info for Order Again + Favorites rows — parts outside
  // the initial catalog window are fetched by variant id.
  const initialMap = buildVariantRowMap(initialProducts)
  const wantedIds = new Set<string>()
  for (const order of orders) {
    for (const item of order.items ?? []) {
      if (item.variant_id) wantedIds.add(item.variant_id)
    }
  }
  for (const fav of favorites) {
    wantedIds.add(fav.variant_id)
  }
  const missingIds = Array.from(wantedIds).filter((id) => !initialMap[id])
  const extraProducts = missingIds.length
    ? await getPortalProductsByVariantIds(missingIds, countryCode)
    : []
  const variantInfo: Record<string, VariantRow> = {
    ...initialMap,
    ...buildVariantRowMap(extraProducts),
  }

  const favoriteRows: VariantRow[] = favorites.map((fav) => {
    const info = variantInfo[fav.variant_id]
    if (info) return info
    return {
      variantId: fav.variant_id,
      sku: null,
      title: "Unavailable part",
      thumbnail: null,
      unitPrice: null,
      currencyCode: null,
      weight: null,
      inventoryQuantity: null,
      manageInventory: true,
      requiresQuote: false,
      available: false,
    }
  })

  const pendingApprovals = approvals.filter((a) => a.status === "pending")
  const canDecideApprovals = role === "admin" || role === "manager"

  return (
    <PortalCartProvider companyId={membership.company.id}>
      <div className="flex flex-col gap-12" data-testid="buyer-portal">
        <QuickOrder
          countryCode={countryCode}
          initialProducts={initialProducts}
          addresses={customer?.addresses ?? []}
          locations={locations}
          assignedLocationId={assignedLocationId}
          initialFavorites={favoriteRows}
          invoicePaymentEnabled={invoicePaymentEnabled}
          currencyCode={currencyCode}
        />

        {canDecideApprovals && pendingApprovals.length > 0 && (
          <ApprovalsSection approvals={pendingApprovals} />
        )}

        <QuotesSection
          quotes={quotes}
          pendingApprovals={canDecideApprovals ? [] : pendingApprovals}
        />

        <OrdersSection orders={orders} variantInfo={variantInfo} />
      </div>
    </PortalCartProvider>
  )
}

export default BuyerPortal
