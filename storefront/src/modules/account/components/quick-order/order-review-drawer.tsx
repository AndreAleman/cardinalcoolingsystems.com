"use client"

/*
  Order Review Drawer — slide-out from the right on the Dashboard's
  Quick Order (ported from accurateforklift.net, adapted to Cardinal's
  money rules). Three views:

    1. items   — the draft lines with qty +/- and remove; shows which
                 lines are Buyable and which are Quote-Only
    2. form    — PO number (required on pay paths), Attn, notes,
                 Bill-to / Ship-to; submit button labelled per path
    3. success — persistent confirmation snapshot taken BEFORE the
                 parent clears the cart; on a mixed checkout it holds
                 the "Continue to Checkout" button

  The path (invoice / checkout / deposit / quote) comes from the parent
  via `plan` — client-side mirror only; the backend re-verifies.
*/

import { useEffect, useMemo, useState } from "react"
import { Button, Input, Textarea } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { convertToLocale } from "@lib/util/money"
import { usePortalCart } from "@lib/context/portal-cart-context"
import AddressPicker, { type AddressPickerValue } from "./address-picker"
import {
  type CartPlan,
  type PortalCartLine,
  isQuoteOnlyLine,
} from "./money-rules"

type View = "items" | "form" | "success"

export type SubmitOutcome = {
  orderPlaced?: boolean
  orderPendingApproval?: boolean
  quoteSent?: boolean
  quotePendingApproval?: boolean
  /* Payable lines are staged in the cookie cart — offer checkout. */
  checkoutReady?: boolean
}

export type DrawerSubmitExtras = {
  po_number: string
  attn_to: string
  notes: string
  billing: AddressPickerValue
  shipping: AddressPickerValue
  shipping_same_as_billing: boolean
}

type Props = {
  open: boolean
  onClose: () => void
  plan: CartPlan
  addresses: HttpTypes.StoreCustomerAddress[]
  countryCode: string
  currencyCode: string
  /* Runs the actual submissions; resolves with what happened. */
  onSubmit: (extras: DrawerSubmitExtras) => Promise<SubmitOutcome>
  /* Redirect to the standard checkout (mixed checkout path). */
  onGoToCheckout: () => void
}

const PATH_LABELS: Record<CartPlan["path"], string> = {
  invoice: "Place Order",
  deposit: "Place Order (50% deposit)",
  checkout: "Review & Pay",
  quote_all: "Submit Quote Request",
  quote_only: "Submit Quote Request",
}

export default function OrderReviewDrawer({
  open,
  onClose,
  plan,
  addresses,
  countryCode,
  currencyCode,
  onSubmit,
  onGoToCheckout,
}: Props) {
  const { lines, updateQty, removeLine } = usePortalCart()
  const [view, setView] = useState<View>("items")
  const [poNumber, setPoNumber] = useState("")
  const [attnTo, setAttnTo] = useState("")
  const [notes, setNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [billTo, setBillTo] = useState<AddressPickerValue>(null)
  const [shipTo, setShipTo] = useState<AddressPickerValue>(null)
  const [shipSameAsBill, setShipSameAsBill] = useState(true)

  // Snapshot for the success view — taken on submit, BEFORE the parent
  // clears the cart, so the confirmation stays accurate.
  const [snapshot, setSnapshot] = useState<{
    po: string
    itemCount: number
    unitCount: number
    outcome: SubmitOutcome
  } | null>(null)

  const isPayPath = plan.path === "invoice" || plan.path === "deposit"
  const isQuotePath = plan.path === "quote_all" || plan.path === "quote_only"
  const poRequired = isPayPath
  const submitLabel = PATH_LABELS[plan.path]
  // Pure checkout (no quote-only lines): PO/attn/notes have nowhere to
  // go — checkout is the standard flow — so hide those fields.
  const isPureCheckout = plan.path === "checkout" && plan.quoteLines.length === 0

  const totalUnits = lines.reduce((sum, l) => sum + l.qty, 0)

  // Reset back to items after the slide-out finishes — except from
  // success, which persists until "Done".
  useEffect(() => {
    if (!open && view !== "success") {
      const t = setTimeout(() => setView("items"), 300)
      return () => clearTimeout(t)
    }
  }, [open, view])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return
      if (view === "form") setView("items")
      else if (view !== "success") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, view, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const fmt = (amount: number) =>
    convertToLocale({ amount, currency_code: currencyCode || "usd" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!lines.length) {
      setError("Your order is empty. Add items before submitting.")
      return
    }
    if (poRequired && !poNumber.trim()) {
      setError("PO number is required to place an order.")
      return
    }
    if (isPayPath && !billTo) {
      setError("Please choose a Bill-to address.")
      return
    }
    if (isPayPath && !shipSameAsBill && !shipTo) {
      setError("Please choose a Ship-to address (or check 'Same as Bill-to').")
      return
    }
    const inlineNeedsFields = (v: AddressPickerValue) =>
      v?.kind === "new" &&
      (!v.address.address_1?.trim() ||
        !v.address.city?.trim() ||
        !v.address.postal_code?.trim())
    if (inlineNeedsFields(billTo)) {
      setError("Bill-to address is missing required fields (street, city, ZIP).")
      return
    }
    if (!shipSameAsBill && inlineNeedsFields(shipTo)) {
      setError("Ship-to address is missing required fields (street, city, ZIP).")
      return
    }

    setSubmitting(true)
    try {
      const outcome = await onSubmit({
        po_number: poNumber.trim(),
        attn_to: attnTo.trim(),
        notes: notes.trim(),
        billing: billTo,
        shipping: shipTo,
        shipping_same_as_billing: shipSameAsBill,
      })
      setSnapshot({
        po: poNumber.trim(),
        itemCount: lines.length,
        unitCount: totalUnits,
        outcome,
      })
      setView("success")
    } catch (err: any) {
      setError(err?.message ?? "Submission failed. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDone = () => {
    onClose()
    setTimeout(() => {
      setView("items")
      setPoNumber("")
      setAttnTo("")
      setNotes("")
      setError(null)
      setBillTo(null)
      setShipTo(null)
      setShipSameAsBill(true)
      setSnapshot(null)
    }, 300)
  }

  const lineIsQuoteOnly = useMemo(() => {
    const map = new Map<string, boolean>()
    lines.forEach((l) => map.set(l.variantId, isQuoteOnlyLine(l)))
    return map
  }, [lines])

  const renderLine = (line: PortalCartLine) => {
    const quoteOnly = lineIsQuoteOnly.get(line.variantId)
    return (
      <li key={line.variantId} className="flex gap-3 px-6 py-4">
        <div className="w-14 h-14 flex-shrink-0 rounded bg-neutral-100 overflow-hidden flex items-center justify-center">
          {line.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={line.thumbnail}
              alt={line.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-neutral-400">—</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[16px] font-medium truncate">{line.title}</p>
            <button
              onClick={() => removeLine(line.variantId)}
              aria-label={`Remove ${line.sku}`}
              className="text-neutral-400 hover:text-red-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-[14px] font-mono text-neutral-500 mt-0.5">
            {line.sku}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border rounded w-fit">
              <button
                onClick={() => updateQty(line.variantId, line.qty - 1)}
                disabled={line.qty <= 1}
                aria-label="Decrease quantity"
                className="w-10 h-10 text-[18px] disabled:opacity-40"
              >
                −
              </button>
              <span className="w-10 text-center text-[16px]">{line.qty}</span>
              <button
                onClick={() => updateQty(line.variantId, line.qty + 1)}
                aria-label="Increase quantity"
                className="w-10 h-10 text-[18px]"
              >
                +
              </button>
            </div>
            {quoteOnly ? (
              <span className="text-[14px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                Quote only
              </span>
            ) : (
              <span className="text-[16px] tabular-nums">
                {fmt((line.unitPrice ?? 0) * line.qty)}
              </span>
            )}
          </div>
        </div>
      </li>
    )
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-300"
        style={{ opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none" }}
        onClick={() => {
          if (view === "success") handleDone()
          else onClose()
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Order review"
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{
          width: "min(520px, 100vw)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b">
          <div className="flex items-center gap-3">
            {view === "form" && (
              <button
                onClick={() => setView("items")}
                aria-label="Back to items"
                className="text-neutral-500 hover:text-neutral-900 text-xl"
              >
                ←
              </button>
            )}
            <h2 className="text-xl font-semibold">
              {view === "items" && "Review Order"}
              {view === "form" &&
                (isQuotePath ? "Quote Request Details" : "Order Details")}
              {view === "success" && "Submitted"}
            </h2>
          </div>
          <button
            onClick={view === "success" ? handleDone : onClose}
            aria-label="Close"
            className="text-neutral-500 hover:text-neutral-900 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* === VIEW: items === */}
        {view === "items" && (
          <>
            <div className="flex-1 overflow-y-auto">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-neutral-500">
                  <p className="font-medium text-[18px]">
                    No items in your order yet.
                  </p>
                  <p className="text-[15px] mt-1">
                    Close this and add items from the Quick Order table.
                  </p>
                </div>
              ) : (
                <ul className="divide-y">{lines.map(renderLine)}</ul>
              )}
            </div>
            {lines.length > 0 && (
              <div className="border-t px-6 py-4 flex flex-col gap-2">
                {plan.payLines.length > 0 && (
                  <div className="flex justify-between text-[16px]">
                    <span className="text-neutral-600">
                      Payable items ({plan.payLines.length})
                    </span>
                    <span className="font-semibold tabular-nums">
                      {fmt(plan.payableTotal)}
                    </span>
                  </div>
                )}
                {plan.quoteLines.length > 0 && (
                  <p className="text-[15px] text-amber-800">
                    {plan.quoteLines.length}{" "}
                    {plan.quoteLines.length === 1 ? "item" : "items"} will be
                    sent as a Quote Request for pricing.
                  </p>
                )}
                <Button
                  variant="primary"
                  size="large"
                  onClick={() => setView("form")}
                  className="w-full h-12 text-[18px]"
                >
                  Continue →
                </Button>
                <Button
                  variant="secondary"
                  onClick={onClose}
                  className="w-full h-12 text-[18px]"
                >
                  Keep editing
                </Button>
              </div>
            )}
          </>
        )}

        {/* === VIEW: form === */}
        {view === "form" && (
          <form
            onSubmit={handleSubmit}
            className="flex-1 flex flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              <div className="rounded border border-neutral-200 bg-neutral-50 px-3 py-2 text-[15px] text-neutral-700">
                {lines.length} {lines.length === 1 ? "item" : "items"},{" "}
                {totalUnits} total {totalUnits === 1 ? "unit" : "units"}
              </div>

              <ul className="border rounded divide-y text-[15px]">
                {lines.map((line) => (
                  <li
                    key={line.variantId}
                    className="px-3 py-2 flex justify-between gap-3"
                  >
                    <span className="font-mono text-neutral-700 truncate">
                      {line.sku}
                    </span>
                    <span className="text-neutral-600 whitespace-nowrap">
                      × {line.qty}
                      {lineIsQuoteOnly.get(line.variantId) && (
                        <span className="ml-2 text-amber-700 font-semibold">
                          quote
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* What will happen, in plain words. */}
              <div className="rounded border border-blue-200 bg-blue-50 px-3 py-2 text-[15px] text-neutral-800">
                {plan.path === "invoice" &&
                  "Your order will be placed and Cardinal will bill your company by invoice."}
                {plan.path === "deposit" &&
                  "Your order will be placed with a 50% deposit due — Cardinal will follow up on payment."}
                {plan.path === "checkout" &&
                  "After this step you'll pay for the in-stock items at checkout."}
                {isQuotePath &&
                  "Cardinal will price these items and reply with a Quote for you to accept."}
                {plan.quoteLines.length > 0 && !isQuotePath && (
                  <>
                    {" "}
                    The {plan.quoteLines.length} quote-only{" "}
                    {plan.quoteLines.length === 1 ? "item" : "items"} will go to
                    Cardinal as a separate Quote Request.
                  </>
                )}
              </div>

              {/* PO number */}
              {!isPureCheckout && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="po-number"
                  className="text-[15px] font-semibold text-neutral-700"
                >
                  PO Number{" "}
                  {poRequired ? (
                    <span className="text-red-600">*</span>
                  ) : (
                    <span className="text-neutral-400 font-normal">
                      (optional)
                    </span>
                  )}
                </label>
                <Input
                  id="po-number"
                  type="text"
                  required={poRequired}
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder={
                    poRequired ? "Your purchase order number" : "If you have one"
                  }
                  disabled={submitting}
                  className="h-12 text-[16px]"
                />
              </div>
              )}

              {/* Attn */}
              {!isPureCheckout && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="attn-to"
                  className="text-[15px] font-semibold text-neutral-700"
                >
                  Attention to{" "}
                  <span className="text-neutral-400 font-normal">
                    (optional)
                  </span>
                </label>
                <Input
                  id="attn-to"
                  type="text"
                  value={attnTo}
                  onChange={(e) => setAttnTo(e.target.value)}
                  placeholder="Who should this go to? e.g. Mike R., Facilities"
                  disabled={submitting}
                  className="h-12 text-[16px]"
                />
              </div>
              )}

              {/* Addresses — required for invoice/deposit orders. */}
              {isPayPath && (
                <>
                  <AddressPicker
                    label="Bill to"
                    addresses={addresses}
                    value={billTo}
                    onChange={setBillTo}
                    disabled={submitting}
                    countryCode={countryCode}
                  />
                  <label className="flex items-center gap-2 text-[15px] text-neutral-700">
                    <input
                      type="checkbox"
                      checked={shipSameAsBill}
                      onChange={(e) => {
                        setShipSameAsBill(e.target.checked)
                        if (e.target.checked) setShipTo(null)
                      }}
                      disabled={submitting}
                      className="rounded border-neutral-300 h-5 w-5"
                    />
                    Ship to the same address
                  </label>
                  <AddressPicker
                    label="Ship to"
                    addresses={addresses}
                    value={shipTo}
                    onChange={setShipTo}
                    disabled={submitting}
                    hidden={shipSameAsBill}
                    countryCode={countryCode}
                  />
                </>
              )}

              {/* Notes */}
              {!isPureCheckout && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="order-notes"
                  className="text-[15px] font-semibold text-neutral-700"
                >
                  Notes{" "}
                  <span className="text-neutral-400 font-normal">
                    (optional)
                  </span>
                </label>
                <Textarea
                  id="order-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Delivery preferences, certifications, etc."
                  rows={3}
                  disabled={submitting}
                  className="text-[16px]"
                />
              </div>
              )}

              {error && (
                <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex flex-col gap-2">
              <Button
                type="submit"
                variant="primary"
                size="large"
                disabled={submitting}
                className="w-full h-12 text-[18px] bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Submitting..." : submitLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setView("items")}
                disabled={submitting}
                className="w-full h-12 text-[18px]"
              >
                ← Back to items
              </Button>
            </div>
          </form>
        )}

        {/* === VIEW: success === */}
        {view === "success" && snapshot && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-3xl font-bold">
              ✓
            </div>
            <div className="flex flex-col gap-2">
              {snapshot.outcome.orderPlaced && (
                <p className="text-[18px] font-semibold text-neutral-900">
                  {snapshot.outcome.orderPendingApproval
                    ? "Your order is waiting for your admin's approval."
                    : "Your order has been placed."}
                </p>
              )}
              {snapshot.outcome.quoteSent && (
                <p className="text-[18px] font-semibold text-neutral-900">
                  {snapshot.outcome.quotePendingApproval
                    ? "Your quote request is waiting for your admin's approval."
                    : "Your quote request was sent to Cardinal."}
                </p>
              )}
              {snapshot.outcome.checkoutReady && (
                <p className="text-[18px] font-semibold text-neutral-900">
                  Your in-stock items are ready to pay for at checkout.
                </p>
              )}
            </div>
            <div className="w-full rounded border bg-neutral-50 px-4 py-3 text-left text-[15px]">
              <div className="flex justify-between">
                <span className="text-neutral-500">PO number</span>
                <span className="font-mono">
                  {snapshot.po || (
                    <span className="text-neutral-400 italic">none</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-neutral-500">Items</span>
                <span>{snapshot.itemCount}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-neutral-500">Total units</span>
                <span>{snapshot.unitCount}</span>
              </div>
            </div>
            {snapshot.outcome.checkoutReady ? (
              <Button
                variant="primary"
                size="large"
                onClick={onGoToCheckout}
                className="w-full h-12 text-[18px] bg-green-600 hover:bg-green-700"
              >
                Continue to Checkout →
              </Button>
            ) : (
              <Button
                variant="primary"
                size="large"
                onClick={handleDone}
                className="w-full h-12 text-[18px]"
              >
                Done
              </Button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
