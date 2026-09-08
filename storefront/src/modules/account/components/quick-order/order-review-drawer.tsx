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
import { HttpTypes } from "@medusajs/types"
import {
  amberPillClass,
  btnPrimary,
  btnSecondary,
  captionClass,
  inputClass,
} from "../portal-ui"
import { convertToLocale } from "@lib/util/money"
import { usePortalCart } from "@lib/context/portal-cart-context"
import type { CompanyLocation } from "@lib/data/dashboard"
import AddressPicker, { type AddressPickerValue } from "./address-picker"
import {
  type CartPlan,
  type PortalCartLine,
  type QuoteOnlyReason,
  quoteOnlyReason,
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
  /* The Company's sites — listed first in the Ship-to picker. */
  locations?: CompanyLocation[]
  /* The member's own assigned site: the Ship-to default when present. */
  assignedLocationId?: string | null
  countryCode: string
  currencyCode: string
  /* PO Upload prefills: the PO's number and the "Also quote: …" note
     carrying its unmatched lines. Never overwrite what the buyer typed. */
  poPrefill?: string
  notesPrefill?: string
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
  locations = [],
  assignedLocationId = null,
  countryCode,
  currencyCode,
  poPrefill,
  notesPrefill,
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
  // Ship-to defaults to the member's own assigned Company site when
  // they have one (and it's still among the Company's sites).
  const defaultShipTo: AddressPickerValue =
    assignedLocationId && locations.some((l) => l.id === assignedLocationId)
      ? { kind: "location", id: assignedLocationId }
      : null

  const [billTo, setBillTo] = useState<AddressPickerValue>(null)
  const [shipTo, setShipTo] = useState<AddressPickerValue>(defaultShipTo)
  const [shipSameAsBill, setShipSameAsBill] = useState(!defaultShipTo)

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

  // PO Upload prefills — fill only fields the buyer hasn't typed in.
  useEffect(() => {
    if (poPrefill) {
      setPoNumber((current) => current || poPrefill)
    }
  }, [poPrefill])
  useEffect(() => {
    if (notesPrefill) {
      setNotes((current) => current || notesPrefill)
    }
  }, [notesPrefill])

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
      setShipTo(defaultShipTo)
      setShipSameAsBill(!defaultShipTo)
      setSnapshot(null)
    }, 300)
  }

  const lineQuoteOnlyReason = useMemo(() => {
    const map = new Map<string, QuoteOnlyReason | null>()
    lines.forEach((l) => map.set(l.variantId, quoteOnlyReason(l)))
    return map
  }, [lines])

  const renderLine = (line: PortalCartLine) => {
    const reason = lineQuoteOnlyReason.get(line.variantId)
    return (
      <li key={line.variantId} className="flex gap-3 px-6 py-4">
        <div className="w-12 h-12 flex-shrink-0 rounded-[5px] border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
          {line.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={line.thumbnail}
              alt={line.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-gray-400">—</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[16px] font-medium truncate">{line.title}</p>
            <button
              onClick={() => removeLine(line.variantId)}
              aria-label={`Remove ${line.sku}`}
              className="text-gray-400 hover:text-[#E3000F] text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-[14px] font-mono text-[#6b7280] mt-0.5">
            {line.sku}
          </p>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center border border-gray-300 rounded-[5px] w-fit">
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
            {reason ? (
              <span className={amberPillClass}>Quote only — {reason}</span>
            ) : (
              <span className="text-[16px] tabular-nums text-[#111111]">
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
        className="fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 motion-reduce:transition-none"
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
        className="fixed top-0 right-0 h-full z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none"
        style={{
          width: "min(520px, 100vw)",
          transform: open ? "translateX(0)" : "translateX(100%)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {view === "form" && (
              <button
                onClick={() => setView("items")}
                aria-label="Back to items"
                className="text-gray-500 hover:text-[#111111] text-xl"
              >
                ←
              </button>
            )}
            <h2 className="text-xl font-semibold tracking-tight text-[#111111]">
              {view === "items" && "Review Order"}
              {view === "form" &&
                (isQuotePath ? "Quote Request Details" : "Order Details")}
              {view === "success" && "Submitted"}
            </h2>
          </div>
          <button
            onClick={view === "success" ? handleDone : onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-[#111111] text-3xl leading-none"
          >
            ×
          </button>
        </div>

        {/* === VIEW: items === */}
        {view === "items" && (
          <>
            <div className="flex-1 overflow-y-auto">
              {lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center text-[#6b7280]">
                  <p className="font-medium text-[16px] text-[#374151]">
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
              <div className="border-t border-gray-200 px-6 py-4 flex flex-col gap-2">
                {plan.payLines.length > 0 && (
                  <div className="flex justify-between text-[16px]">
                    <span className="text-[#6b7280]">
                      Payable items ({plan.payLines.length})
                    </span>
                    <span className="font-semibold tabular-nums text-[#111111]">
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
                <button
                  type="button"
                  onClick={() => setView("form")}
                  className={`${btnPrimary} w-full`}
                >
                  Continue →
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`${btnSecondary} w-full`}
                >
                  Keep editing
                </button>
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
              <div className="rounded-[5px] border border-gray-200 bg-gray-50 px-3 py-2 text-[15px] text-[#374151]">
                {lines.length} {lines.length === 1 ? "item" : "items"},{" "}
                {totalUnits} total {totalUnits === 1 ? "unit" : "units"}
              </div>

              <ul className="border border-gray-200 rounded-[5px] divide-y divide-gray-100 text-[15px]">
                {lines.map((line) => (
                  <li
                    key={line.variantId}
                    className="px-3 py-2 flex justify-between gap-3"
                  >
                    <span className="font-mono text-[#374151] truncate">
                      {line.sku}
                    </span>
                    <span className="text-[#6b7280] whitespace-nowrap tabular-nums">
                      × {line.qty}
                      {lineQuoteOnlyReason.get(line.variantId) && (
                        <span className="ml-2 text-amber-700 font-medium">
                          quote
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* What will happen, in plain words. */}
              <div className="rounded-[5px] border px-3 py-2 text-[15px] text-[#374151]" style={{ borderColor: "rgba(227,0,15,0.15)", backgroundColor: "rgba(227,0,15,0.04)" }}>
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
                  className="text-[15px] font-semibold text-[#374151]"
                >
                  PO Number{" "}
                  {poRequired ? (
                    <span className="text-[#E3000F]">*</span>
                  ) : (
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  )}
                </label>
                <input
                  id="po-number"
                  type="text"
                  required={poRequired}
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder={
                    poRequired ? "Your purchase order number" : "If you have one"
                  }
                  disabled={submitting}
                  className={inputClass}
                />
              </div>
              )}

              {/* Attn */}
              {!isPureCheckout && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="attn-to"
                  className="text-[15px] font-semibold text-[#374151]"
                >
                  Attention to{" "}
                  <span className="text-gray-400 font-normal">
                    (optional)
                  </span>
                </label>
                <input
                  id="attn-to"
                  type="text"
                  value={attnTo}
                  onChange={(e) => setAttnTo(e.target.value)}
                  placeholder="Who should this go to? e.g. Mike R., Facilities"
                  disabled={submitting}
                  className={inputClass}
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
                  <label className="flex items-center gap-2 text-[15px] text-[#374151]">
                    <input
                      type="checkbox"
                      checked={shipSameAsBill}
                      onChange={(e) => {
                        setShipSameAsBill(e.target.checked)
                        setShipTo(e.target.checked ? null : defaultShipTo)
                      }}
                      disabled={submitting}
                      className="rounded border-gray-300 h-5 w-5 accent-[#E3000F]"
                    />
                    Ship to the same address
                  </label>
                  <AddressPicker
                    label="Ship to"
                    addresses={addresses}
                    locations={locations}
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
                  className="text-[15px] font-semibold text-[#374151]"
                >
                  Notes{" "}
                  <span className="text-gray-400 font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="order-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything else we should know — including parts you need that aren't in our catalog (part number + quantity) — we'll include them in your quote."
                  rows={3}
                  disabled={submitting}
                  className="rounded-[5px] border border-gray-300 bg-white px-3 py-2 text-[16px] text-[#111111] placeholder:text-gray-400 focus:outline-none focus:border-[#E3000F] focus:ring-2 focus:ring-[#E3000F]/15 disabled:opacity-50"
                />
              </div>
              )}

              {error && (
                <div className="rounded-[5px] border border-red-300 bg-red-50 px-3 py-2 text-[15px] text-red-700">
                  {error}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 px-6 py-4 flex flex-col gap-2">
              <button
                type="submit"
                disabled={submitting}
                className={`${btnPrimary} w-full`}
              >
                {submitting ? "Submitting..." : submitLabel}
              </button>
              <button
                type="button"
                onClick={() => setView("items")}
                disabled={submitting}
                className={`${btnSecondary} w-full`}
              >
                ← Back to items
              </button>
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
                <p className="text-[17px] font-semibold text-[#111111]">
                  {snapshot.outcome.orderPendingApproval
                    ? "Your order is waiting for your admin's approval."
                    : "Your order has been placed."}
                </p>
              )}
              {snapshot.outcome.quoteSent && (
                <p className="text-[17px] font-semibold text-[#111111]">
                  {snapshot.outcome.quotePendingApproval
                    ? "Your quote request is waiting for your admin's approval."
                    : "Your quote request was sent to Cardinal."}
                </p>
              )}
              {snapshot.outcome.checkoutReady && (
                <p className="text-[17px] font-semibold text-[#111111]">
                  Your in-stock items are ready to pay for at checkout.
                </p>
              )}
            </div>
            <div className="w-full rounded-[5px] border border-gray-200 bg-gray-50 px-4 py-3 text-left text-[15px]">
              <div className="flex justify-between">
                <span className="text-[#6b7280]">PO number</span>
                <span className="font-mono">
                  {snapshot.po || (
                    <span className="text-gray-400 italic">none</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#6b7280]">Items</span>
                <span className="tabular-nums">{snapshot.itemCount}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[#6b7280]">Total units</span>
                <span className="tabular-nums">{snapshot.unitCount}</span>
              </div>
            </div>
            {snapshot.outcome.checkoutReady ? (
              <button
                type="button"
                onClick={onGoToCheckout}
                className={`${btnPrimary} w-full`}
              >
                Continue to Checkout →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDone}
                className={`${btnPrimary} w-full`}
              >
                Done
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  )
}
