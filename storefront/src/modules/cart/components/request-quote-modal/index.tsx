"use client"

/*
  Guest Quote from the public cart (CONTEXT.md): a secondary "Request a
  Quote instead" button next to checkout. Opens a plain-overlay modal
  (large controls, like the Dashboard's modals) asking name, email,
  company, optional phone + note, and submits the current cookie cart
  through the public /store/order-form/guest-quote route.

  On success the panel content is REPLACED by a persistent confirmation
  (big green check, no toast). The cart cookie is cleared server-side;
  the page refreshes only when the visitor closes the confirmation, so
  the message can't be missed. Signed-in Team Members may use it too —
  their name/email prefill from the customer record.

  Hardened like the contact form (plan B4): honeypot `website`,
  `elapsed_ms` and the Turnstile token ride in the body. On success it
  fires PostHog contact_form_submitted with source "builder" when the
  cart holds a Cardinal Builder line, otherwise "cart"; the GTM
  quote_requested push is unchanged. Builder lines are listed with their
  Part Number, configuration and Quote badge.
*/

import { useRef, useState, type MutableRefObject } from "react"
import { useRouter } from "next/navigation"
import { Button, Input, Textarea } from "@medusajs/ui"
import { HttpTypes } from "@medusajs/types"
import { finalizeGuestQuote, submitGuestQuote } from "@lib/data/guest-quote"
import { builderLineView, guestQuoteSource } from "@lib/builder/quote-line"
import { captureEvent, identifyUser } from "@lib/util/posthog"
import { useBotGuard } from "@modules/common/components/bot-guard"

type Props = {
  customer?: HttpTypes.StoreCustomer | null
  /** The cart's lines: builder lines are listed and set the analytics source. */
  items?: HttpTypes.StoreCartLineItem[] | null
}

type Guard = ReturnType<typeof useBotGuard>

/* Mounted inside the <form> so the bot guard arms on it (its effect looks for the closest form). */
function GuardField({ guardRef }: { guardRef: MutableRefObject<Guard | null> }) {
  const guard = useBotGuard()
  guardRef.current = guard
  return guard.field
}

const RequestQuoteModal = ({ customer, items }: Props) => {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(customer?.first_name ?? "")
  const [lastName, setLastName] = useState(customer?.last_name ?? "")
  const [email, setEmail] = useState(customer?.email ?? "")
  const [companyName, setCompanyName] = useState("")
  const [phone, setPhone] = useState(customer?.phone ?? "")
  const [notes, setNotes] = useState("")
  const guardRef = useRef<Guard | null>(null)
  const builderLines = (items ?? [])
    .map((i) => ({ id: i.id, quantity: i.quantity, view: builderLineView(i as any) }))
    .filter((x) => x.view !== null)

  const close = async () => {
    if (submitting) return
    setOpen(false)
    setError(null)
    if (sent) {
      // The cart now belongs to the quote request. Clearing it here —
      // not in the submit action — keeps the confirmation on screen
      // until the buyer dismisses it (a revalidate during submit
      // re-renders the page and unmounts this modal).
      await finalizeGuestQuote().catch(() => {})
      router.refresh()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const bot = guardRef.current ? await guardRef.current.values() : undefined
      const res = await submitGuestQuote({
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company_name: companyName.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        ...bot,
      })
      if (!res.success) {
        setError(res.message)
        return
      }
      setSent(true)
      captureEvent("contact_form_submitted", {
        source: guestQuoteSource(items as any),
        form_location: "guest_quote",
        email: email.trim(),
        builder_lines: builderLines.length,
      })
      identifyUser(email.trim(), {
        email: email.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        company: companyName.trim(),
      })
      // Mirror the site's other GTM pushes (contact_form_submitted is untouched).
      try {
        const w = window as any
        w.dataLayer = w.dataLayer || []
        w.dataLayer.push({ event: "quote_requested" })
      } catch {
        // analytics must never break the flow
      }
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.")
    } finally {
      guardRef.current?.reset()
      setSubmitting(false)
    }
  }

  return (
    <>
      <Button
        variant="secondary"
        className="w-full h-10"
        onClick={() => setOpen(true)}
        data-testid="request-quote-button"
      >
        Request a Quote instead
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Request a quote"
        >
          {/* Plain overlay */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={close}
            aria-hidden="true"
          />

          <div className="relative w-full max-w-lg bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            {sent ? (
              /* Persistent confirmation — replaces the panel content. */
              <div
                className="flex flex-col items-center gap-4 p-10 text-center"
                data-testid="guest-quote-confirmation"
              >
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <svg
                    className="w-9 h-9 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <p className="text-2xl font-semibold text-green-800 m-0">
                  Quote request sent
                </p>
                <p className="text-[17px] text-neutral-700 m-0">
                  We&apos;ll reply within 1 business day.
                </p>
                <Button
                  variant="secondary"
                  className="h-12 px-6 text-[16px] mt-2"
                  onClick={close}
                >
                  Close
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="relative flex flex-col gap-4 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold m-0">
                      Request a Quote
                    </h2>
                    <p className="text-[15px] text-neutral-600 m-0 mt-1">
                      We&apos;ll price the items in your cart and reply within
                      1 business day.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Close"
                    className="p-1 text-neutral-400 hover:text-neutral-700"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 small:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="guest-quote-first-name"
                      className="text-[15px] font-medium text-neutral-700"
                    >
                      First name *
                    </label>
                    <Input
                      id="guest-quote-first-name"
                      required
                      autoComplete="given-name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-12 text-[16px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      htmlFor="guest-quote-last-name"
                      className="text-[15px] font-medium text-neutral-700"
                    >
                      Last name *
                    </label>
                    <Input
                      id="guest-quote-last-name"
                      required
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-12 text-[16px]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="guest-quote-email"
                    className="text-[15px] font-medium text-neutral-700"
                  >
                    Work email *
                  </label>
                  <Input
                    id="guest-quote-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 text-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="guest-quote-company"
                    className="text-[15px] font-medium text-neutral-700"
                  >
                    Company name *
                  </label>
                  <Input
                    id="guest-quote-company"
                    required
                    autoComplete="organization"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="h-12 text-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="guest-quote-phone"
                    className="text-[15px] font-medium text-neutral-700"
                  >
                    Phone (optional)
                  </label>
                  <Input
                    id="guest-quote-phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-12 text-[16px]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    htmlFor="guest-quote-notes"
                    className="text-[15px] font-medium text-neutral-700"
                  >
                    Note (optional)
                  </label>
                  <Textarea
                    id="guest-quote-notes"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Anything we should know — quantities, timelines, specs"
                    className="text-[16px]"
                  />
                </div>

                {builderLines.length > 0 && (
                  <div
                    className="flex flex-col gap-2 border border-neutral-200 bg-neutral-50 p-3"
                    data-testid="guest-quote-builder-lines"
                  >
                    <p className="text-[13px] font-semibold uppercase tracking-wide text-neutral-600 m-0">
                      Configurations to quote
                    </p>
                    {builderLines.map(({ id, quantity, view }) => (
                      <div key={id} className="text-[14px]">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-semibold break-all">{view!.partNumber}</span>
                          {view!.quote && (
                            <span className="bg-neutral-900 px-1.5 py-0.5 text-[11px] font-semibold uppercase text-white">
                              Quote
                            </span>
                          )}
                          <span className="text-neutral-500">× {quantity}</span>
                        </div>
                        {view!.display.length > 0 && (
                          <p className="text-[13px] text-neutral-600 m-0">
                            {view!.display.map((r) => `${r.label}: ${r.value}`).join(" · ")}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <GuardField guardRef={guardRef} />

                {error && (
                  <p
                    className="text-[15px] text-red-600 m-0"
                    data-testid="guest-quote-error"
                  >
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-12 text-[16px]"
                  isLoading={submitting}
                  disabled={submitting}
                  data-testid="guest-quote-submit"
                >
                  Send quote request
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default RequestQuoteModal
