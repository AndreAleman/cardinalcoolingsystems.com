"use client"

import { useEffect, useRef, useState } from "react"
import { useQuote } from "@lib/context/quote-context"
import { captureEvent, identifyUser } from "@lib/util/posthog"
import { filesToAttachments } from "@lib/util/attachments"
import AttachmentInput from "@modules/common/components/attachment-input"

type View = "items" | "form" | "success"

const TIMELINE_OPTIONS = [
  "As soon as possible",
  "Within 1–2 weeks",
  "Within 1 month",
  "1–3 months",
  "Just exploring pricing",
]

export default function QuotePanel() {
  const {
    quoteItems,
    quoteCount,
    removeFromQuote,
    updateQuoteQuantity,
    clearQuote,
    isQuotePanelOpen,
    closeQuotePanel,
  } = useQuote()

  const [view, setView] = useState<View>("items")
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [company, setCompany] = useState("")
  const [timeline, setTimeline] = useState("")
  const [notes, setNotes] = useState("")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])

  // Reset to items view when panel closes
  useEffect(() => {
    if (!isQuotePanelOpen) {
      const t = setTimeout(() => {
        if (view !== "success") setView("items")
      }, 300)
      return () => clearTimeout(t)
    }
  }, [isQuotePanelOpen, view])

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (view === "form") setView("items")
        else closeQuotePanel()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [closeQuotePanel, view])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isQuotePanelOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [isQuotePanelOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try {
      const attachments = await filesToAttachments(attachedFiles)

      const res = await fetch("/api/quote/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          company,
          timeline,
          notes,
          items: quoteItems,
          ...(attachments.length > 0 ? { attachments } : {}),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to submit quote")
      }

      // PostHog: track the B2B quote conversion and identify the lead by email
      captureEvent("form_submitted", {
        form_type: "b2b_quote",
        form_location: "quote_panel",
        num_products: quoteItems.length,
        num_units: quoteCount,
        num_attachments: attachments.length,
        timeline,
        company,
        email,
      })
      identifyUser(email, {
        email,
        name,
        phone,
        company,
      })

      setView("success")
      clearQuote()
      setAttachedFiles([])
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    closeQuotePanel()
    if (view === "success") {
      setTimeout(() => {
        setView("items")
        setName(""); setEmail(""); setPhone(""); setCompany(""); setTimeline(""); setNotes("")
        setAttachedFiles([])
      }, 300)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: isQuotePanelOpen ? 1 : 0,
          pointerEvents: isQuotePanelOpen ? "auto" : "none",
        }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-full z-[61] flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out"
        style={{
          width: "min(440px, 100vw)",
          transform: isQuotePanelOpen ? "translateX(0)" : "translateX(100%)",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Quote request panel"
      >
        {/* ── HEADER ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            {view === "form" && (
              <button
                onClick={() => setView("items")}
                className="flex items-center justify-center w-7 h-7 rounded transition-colors hover:bg-gray-100 -ml-1"
                style={{ color: "#6b7280" }}
                aria-label="Back to items"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            <svg className="w-5 h-5" style={{ color: "#E3000F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
            </svg>
            <div className="text-base font-semibold" style={{ color: "#111111" }}>
              {view === "items" && "Quote Request"}
              {view === "form" && "Your Details"}
              {view === "success" && "Quote Submitted"}
            </div>
            {view === "items" && quoteCount > 0 && (
              <span
                className="text-white text-xs font-semibold px-2 py-0.5 leading-none"
                style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              >
                {quoteCount} {quoteCount === 1 ? "item" : "items"}
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            aria-label="Close quote panel"
            className="flex items-center justify-center w-8 h-8 rounded transition-colors hover:bg-gray-100"
            style={{ color: "#6b7280" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── VIEW: ITEMS ── */}
        {view === "items" && (
          <>
            <div className="flex-1 overflow-y-auto">
              {quoteItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6 py-16 text-center">
                  <div className="w-16 h-16 flex items-center justify-center" style={{ backgroundColor: "#f3f4f6", borderRadius: "5px" }}>
                    <svg className="w-8 h-8" style={{ color: "#d1d5db" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#111111" }}>Your quote list is empty</p>
                    <p className="text-sm mt-1" style={{ color: "#9ca3af" }}>Add products using the "Add to Quote" button on any product page.</p>
                  </div>
                  <button onClick={closeQuotePanel} className="text-sm font-medium underline underline-offset-2" style={{ color: "#E3000F" }}>
                    Continue browsing
                  </button>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {quoteItems.map((item) => (
                    <li key={item.variantId} className="flex gap-4 px-6 py-5">
                      <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-gray-50 flex items-center justify-center" style={{ borderRadius: "5px", border: "1px solid #f3f4f6" }}>
                        {item.productThumbnail ? (
                          <img src={item.productThumbnail} alt={item.productTitle} className="w-full h-full object-contain" />
                        ) : (
                          <svg className="w-7 h-7" style={{ color: "#d1d5db" }} fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug" style={{ color: "#111111" }}>{item.productTitle}</p>
                          <button onClick={() => removeFromQuote(item.variantId)} aria-label={`Remove ${item.productTitle}`} className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded transition-colors hover:bg-gray-100 mt-0.5" style={{ color: "#9ca3af" }}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                        {item.variantOptions && item.variantOptions.length > 0 && (
                          <p className="text-xs mt-0.5" style={{ color: "#6b7280" }}>{item.variantOptions.map((o) => o.value).join(" · ")}</p>
                        )}
                        {item.variantSku && (
                          <p className="text-xs font-mono mt-0.5" style={{ color: "#E3000F" }}>SKU: {item.variantSku}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex items-center border border-gray-200" style={{ borderRadius: "5px" }}>
                            <button onClick={() => updateQuoteQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Decrease quantity" className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors" style={{ color: "#374151" }}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
                            </button>
                            <span className="w-8 text-center text-sm font-medium select-none" style={{ color: "#111111" }}>{item.quantity}</span>
                            <button onClick={() => updateQuoteQuantity(item.variantId, item.quantity + 1)} aria-label="Increase quantity" className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 transition-colors" style={{ color: "#374151" }}>
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {quoteItems.length > 0 && (
              <div className="flex-shrink-0 border-t border-gray-100 px-6 py-5 flex flex-col gap-3">
                <button
                  onClick={() => setView("form")}
                  className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-200"
                  style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F")}
                  data-testid="submit-quote-button"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  Submit Quote Request
                </button>
                <button onClick={clearQuote} className="text-xs text-center transition-colors hover:text-gray-600" style={{ color: "#9ca3af" }}>
                  Clear all items
                </button>
              </div>
            )}
          </>
        )}

        {/* ── VIEW: FORM ── */}
        {view === "form" && (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">

              {/* Item summary pill */}
              <div className="flex items-center gap-2 px-3 py-2 text-sm" style={{ backgroundColor: "#fff8f8", border: "1px solid #fecaca", borderRadius: "5px", color: "#374151" }}>
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: "#E3000F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                <span>{quoteItems.length} {quoteItems.length === 1 ? "product" : "products"}, {quoteCount} total {quoteCount === 1 ? "unit" : "units"}</span>
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>
                  Full Name <span style={{ color: "#E3000F" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                  style={{ borderRadius: "5px", color: "#111111" }}
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>
                  Email <span style={{ color: "#E3000F" }}>*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@company.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                  style={{ borderRadius: "5px", color: "#111111" }}
                />
              </div>

              {/* Phone + Company row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                    style={{ borderRadius: "5px", color: "#111111" }}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>Company</label>
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors"
                    style={{ borderRadius: "5px", color: "#111111" }}
                  />
                </div>
              </div>

              {/* Timeline */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>Timeline</label>
                <div className="relative">
                  <select
                    value={timeline}
                    onChange={(e) => setTimeline(e.target.value)}
                    className="w-full px-3 py-2.5 pr-9 text-sm border border-gray-200 bg-white focus:outline-none focus:border-gray-400 transition-colors appearance-none"
                    style={{ borderRadius: "5px", color: timeline ? "#111111" : "#9ca3af" }}
                  >
                    <option value="">Select timeline…</option>
                    {TIMELINE_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="w-4 h-4" style={{ color: "#9ca3af" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "#6b7280" }}>Notes / Special Requirements</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Specific grades, tolerances, delivery address, certifications needed…"
                  rows={4}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 focus:outline-none focus:border-gray-400 transition-colors resize-none"
                  style={{ borderRadius: "5px", color: "#111111" }}
                />
              </div>

              {/* Attachments */}
              <AttachmentInput
                files={attachedFiles}
                onChange={setAttachedFiles}
                disabled={submitting}
                labelClassName="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-[#6b7280]"
              />

              {formError && (
                <p className="text-sm px-3 py-2.5" style={{ color: "#dc2626", backgroundColor: "#fef2f2", borderRadius: "5px", border: "1px solid #fecaca" }}>
                  {formError}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-100 px-6 py-5 flex flex-col gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
                onMouseEnter={(e) => { if (!submitting) (e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d" }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F" }}
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                    Send Quote Request
                  </>
                )}
              </button>
              <p className="text-xs text-center" style={{ color: "#9ca3af" }}>
                We'll respond within 1 business day.
              </p>
            </div>
          </form>
        )}

        {/* ── VIEW: SUCCESS ── */}
        {view === "success" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8 py-16 text-center">
            <div
              className="w-16 h-16 flex items-center justify-center"
              style={{ backgroundColor: "rgba(227,0,15,0.08)", borderRadius: "50%" }}
            >
              <svg className="w-8 h-8" style={{ color: "#E3000F" }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: "#111111" }}>Quote request sent!</h3>
              <p className="text-sm mt-2 leading-relaxed" style={{ color: "#6b7280" }}>
                We've emailed you a confirmation and our team will follow up within 1 business day.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="w-full h-12 flex items-center justify-center text-sm font-semibold text-white transition-all duration-200"
              style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F")}
            >
              Continue browsing
            </button>
          </div>
        )}
      </div>
    </>
  )
}
