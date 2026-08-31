/*
  Quotes section — stacked on the one-page Dashboard, grouped by
  lifecycle stage (ported from accurateforklift.net's quotes page):

    1. Awaiting your response   (pending_customer — Cardinal has priced)
    2. Waiting for approval     (held submissions: pending Approvals the
                                 signed-in person can see)
    3. Waiting for Cardinal     (pending_merchant)
    4. Accepted
    5. Rejected

  Sections hide when empty. Each quote links to its details subroute.
*/

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import type { PortalQuote } from "@lib/data/quotes"
import type { Approval } from "@lib/data/dashboard"
import QuoteStatusBadge from "./quote-status-badge"

type Props = {
  quotes: PortalQuote[]
  pendingApprovals: Approval[]
}

function formatDate(value: string): string {
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return value
  }
}

function QuoteRow({ quote }: { quote: PortalQuote }) {
  const order = quote.draft_order
  const itemCount =
    order?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) ?? 0
  return (
    <li className="flex flex-col small:flex-row small:items-center justify-between gap-2 py-3 border-b border-neutral-100 last:border-b-0">
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-[16px] font-semibold">
          Quote #{order?.display_id ?? "—"}
        </span>
        <span className="text-[15px] text-neutral-500">
          {formatDate(quote.created_at)}
        </span>
        <QuoteStatusBadge status={quote.status} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[16px] tabular-nums">
          {order?.total != null
            ? convertToLocale({
                amount: order.total,
                currency_code: order.currency_code ?? "usd",
              })
            : "—"}
          <span className="text-neutral-500">
            {" "}
            · {itemCount} {itemCount === 1 ? "item" : "items"}
          </span>
        </span>
        <LocalizedClientLink
          href={`/account/quotes/details/${quote.id}`}
          className="inline-flex items-center h-12 px-5 rounded-md border border-neutral-300 text-[16px] font-medium hover:bg-neutral-50"
        >
          See details
        </LocalizedClientLink>
      </div>
    </li>
  )
}

function Group({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <h3 className="text-[17px] font-semibold text-neutral-700 border-b border-neutral-200 pb-1 mb-1">
        {title}
      </h3>
      {children}
    </div>
  )
}

const QuotesSection = ({ quotes, pendingApprovals }: Props) => {
  const awaitingCustomer = quotes.filter((q) => q.status === "pending_customer")
  const awaitingMerchant = quotes.filter((q) => q.status === "pending_merchant")
  const accepted = quotes.filter((q) => q.status === "accepted")
  const rejected = quotes.filter(
    (q) => q.status === "customer_rejected" || q.status === "merchant_rejected"
  )
  const held = pendingApprovals.filter((a) => a.status === "pending")

  const isEmpty =
    !awaitingCustomer.length &&
    !awaitingMerchant.length &&
    !accepted.length &&
    !rejected.length &&
    !held.length

  return (
    <section className="flex flex-col" data-testid="quotes-section">
      <h2 className="text-xl-semi mb-4">Quotes</h2>

      {isEmpty && (
        <p className="text-[16px] text-neutral-500">
          No quotes yet. Quote-only items from Quick Order will show up here.
        </p>
      )}

      {awaitingCustomer.length > 0 && (
        <Group title="Awaiting your response">
          <ul>
            {awaitingCustomer.map((q) => (
              <QuoteRow key={q.id} quote={q} />
            ))}
          </ul>
        </Group>
      )}

      {held.length > 0 && (
        <Group title="Waiting for approval">
          <ul>
            {held.map((a) => {
              const itemCount =
                a.cart?.items?.reduce((acc, item) => acc + item.quantity, 0) ??
                0
              return (
                <li
                  key={a.id}
                  className="flex flex-col small:flex-row small:items-center justify-between gap-2 py-3 border-b border-neutral-100 last:border-b-0"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-[16px] text-neutral-700">
                      {a.cart?.request_type === "quote"
                        ? "Quote request"
                        : "Order"}{" "}
                      from{" "}
                      <span className="font-semibold">
                        {a.submitter?.name ||
                          a.submitter?.email ||
                          "a team member"}
                      </span>{" "}
                      waiting for your admin&apos;s approval
                    </span>
                    {a.cart?.items?.length ? (
                      <span className="text-[15px] text-neutral-500 truncate">
                        {a.cart.items
                          .map(
                            (item) =>
                              `${item.quantity}× ${
                                item.variant_sku || item.title
                              }`
                          )
                          .join(", ")}
                      </span>
                    ) : null}
                    {a.cart?.po_number && (
                      <span className="text-[15px] text-neutral-500">
                        PO: <span className="font-mono">{a.cart.po_number}</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[16px] tabular-nums whitespace-nowrap">
                    {a.cart?.total != null && a.cart.total > 0
                      ? convertToLocale({
                          amount: a.cart.total,
                          currency_code: a.cart.currency_code || "usd",
                        })
                      : "—"}
                    <span className="text-neutral-500">
                      {" "}
                      · {itemCount} {itemCount === 1 ? "item" : "items"}
                    </span>
                  </span>
                </li>
              )
            })}
          </ul>
        </Group>
      )}

      {awaitingMerchant.length > 0 && (
        <Group title="Waiting for Cardinal">
          <ul>
            {awaitingMerchant.map((q) => (
              <QuoteRow key={q.id} quote={q} />
            ))}
          </ul>
        </Group>
      )}

      {accepted.length > 0 && (
        <Group title="Accepted">
          <ul>
            {accepted.map((q) => (
              <QuoteRow key={q.id} quote={q} />
            ))}
          </ul>
        </Group>
      )}

      {rejected.length > 0 && (
        <Group title="Rejected">
          <ul>
            {rejected.map((q) => (
              <QuoteRow key={q.id} quote={q} />
            ))}
          </ul>
        </Group>
      )}
    </section>
  )
}

export default QuotesSection
