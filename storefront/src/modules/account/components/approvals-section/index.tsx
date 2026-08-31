"use client"

/*
  Approvals section — shown to admins/managers when Team Members'
  submissions are held for sign-off (the Company's Approval Setting is
  on). Approving releases the held cart into its quote/order flow;
  rejecting stops it.
*/

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button, toast } from "@medusajs/ui"
import { convertToLocale } from "@lib/util/money"
import { decideApproval, type Approval } from "@lib/data/dashboard"

type Props = {
  approvals: Approval[]
}

const ApprovalsSection = ({ approvals }: Props) => {
  const router = useRouter()
  const [pendingList, setPendingList] = useState(
    approvals.filter((a) => a.status === "pending")
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  if (!pendingList.length) return null

  const decide = (approval: Approval, status: "approved" | "rejected") => {
    setBusyId(approval.id)
    startTransition(async () => {
      try {
        await decideApproval(approval.id, status)
        setPendingList((prev) => prev.filter((a) => a.id !== approval.id))
        toast.success(
          status === "approved"
            ? "Approved — the submission is on its way to Cardinal."
            : "Rejected — the submission will not be sent."
        )
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message ?? "Could not update the approval.")
      } finally {
        setBusyId(null)
      }
    })
  }

  return (
    <section className="flex flex-col gap-4" data-testid="approvals-section">
      <h2 className="text-xl-semi m-0">Approvals</h2>
      <p className="text-[16px] text-neutral-600 m-0">
        These submissions from your team are waiting for your sign-off.
      </p>
      <ul className="flex flex-col divide-y divide-neutral-100 border-y border-neutral-100">
        {pendingList.map((approval) => (
          <li
            key={approval.id}
            className="flex flex-col small:flex-row small:items-start justify-between gap-3 py-4"
          >
            <div className="flex flex-col gap-1 text-[16px] text-neutral-700 min-w-0">
              <div>
                <span className="font-semibold">
                  {approval.submitter?.name ||
                    approval.submitter?.email ||
                    "A team member"}
                </span>{" "}
                submitted{" "}
                {approval.cart?.request_type === "quote"
                  ? "a quote request"
                  : "an order"}{" "}
                for approval
                {approval.cart?.total != null && approval.cart.total > 0 && (
                  <>
                    {" — "}
                    <span className="font-semibold tabular-nums">
                      {convertToLocale({
                        amount: approval.cart.total,
                        currency_code: approval.cart.currency_code || "usd",
                      })}
                    </span>
                  </>
                )}
              </div>
              {approval.cart?.po_number && (
                <div className="text-[15px] text-neutral-600">
                  PO number:{" "}
                  <span className="font-mono">{approval.cart.po_number}</span>
                </div>
              )}
              {approval.cart?.items?.length ? (
                <ul className="text-[15px] text-neutral-600 list-disc pl-5 m-0">
                  {approval.cart.items.map((item, idx) => (
                    <li key={idx}>
                      {item.quantity}× {item.variant_sku || item.title}
                      {item.variant_sku && item.title
                        ? ` — ${item.title}`
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-[15px] text-neutral-500">
                  Submission{" "}
                  <span className="font-mono">{approval.cart_id.slice(-8)}</span>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="h-12 px-5 text-[16px]"
                disabled={busyId === approval.id}
                onClick={() => decide(approval, "rejected")}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                className="h-12 px-5 text-[16px] bg-green-600 hover:bg-green-700"
                disabled={busyId === approval.id}
                onClick={() => decide(approval, "approved")}
              >
                {busyId === approval.id ? "Working..." : "Approve"}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ApprovalsSection
