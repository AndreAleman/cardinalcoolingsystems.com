"use client"

/*
  Quote request form for the stainless tubing landing page.

  Sends through the existing contact flow (POST /store/contact via
  postContactRequest — same endpoint, validation and email as /contact)
  and fires the same conversion events as the contact page: GA4
  `contact_form_submit` and PostHog `contact_form_submitted`, with
  form_location "stainless_tube_page". No new backend endpoint.

  The chosen sizes, quantity and ship-to location are folded into the
  `message` field, so the backend schema is untouched.
*/

import { FormEvent, useEffect, useMemo, useRef, useState } from "react"
import { filesToAttachments } from "@lib/util/attachments"
import { postContactRequest } from "@lib/util/contact-request"
import { captureEvent, identifyUser } from "@lib/util/posthog"
import AttachmentInput from "@modules/common/components/attachment-input"
import type { TubeVariantOption } from "@lib/stainless-tube"

const FORM_LOCATION = "stainless_tube_page"

type Props = {
  options: TubeVariantOption[]
}

export default function TubeQuoteForm({ options }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const formRef = useRef<HTMLFormElement>(null)

  /* ?sku=AI270P-4200 (from the product page's Request-a-quote button)
     pre-ticks that size; a SKU outside the table goes into Notes so it is
     not lost. Read once on mount; window.location keeps the page free of a
     useSearchParams Suspense boundary. */
  useEffect(() => {
    const sku = new URLSearchParams(window.location.search).get("sku")?.trim()
    if (!sku) return
    if (options.some((o) => o.sku === sku)) {
      setSelected((prev) => (prev.includes(sku) ? prev : [...prev, sku]))
      return
    }
    const notes = formRef.current?.elements.namedItem("notes")
    if (notes instanceof HTMLTextAreaElement && !notes.value) {
      notes.value = `Part number: ${sku.slice(0, 64)}\n`
    }
  }, [options])

  const bySize = useMemo(() => {
    const groups = new Map<string, TubeVariantOption[]>()
    for (const o of options) {
      const key = `${o.od} OD × ${o.wall} wall`
      groups.set(key, [...(groups.get(key) ?? []), o])
    }
    return Array.from(groups.entries())
  }, [options])

  const toggle = (sku: string) =>
    setSelected((prev) =>
      prev.includes(sku) ? prev.filter((s) => s !== sku) : [...prev, sku]
    )

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus("idle")

    const formData = new FormData(e.currentTarget)
    const get = (k: string) => ((formData.get(k) as string) ?? "").trim()
    const name = get("name")
    const lastName = get("lastName")
    const email = get("email")
    const phone = get("phone")
    const company = get("company")
    const quantity = get("quantity")
    const shipTo = get("shipTo")
    const notes = get("notes")

    const chosen = options.filter((o) => selected.includes(o.sku))
    const sizeLines = chosen.length
      ? chosen.map((o) => `- ${o.label} (${o.sku})`).join("\n")
      : "- Not specified (see notes)"

    const message = [
      "Stainless tubing quote request (stainless-steel-tubing page)",
      "",
      `Company: ${company || "Not provided"}`,
      "",
      "Sizes / alloys:",
      sizeLines,
      "",
      `Quantity (total feet or number of lengths): ${quantity || "Not provided"}`,
      `Ship-to city / ZIP: ${shipTo || "Not provided"}`,
      "",
      "Notes:",
      notes || "None",
    ].join("\n")

    try {
      const attachments = await filesToAttachments(attachedFiles)
      const ok = await postContactRequest({
        name,
        lastName,
        email,
        phone,
        message,
        attachments,
      })

      if (ok) {
        if (typeof window !== "undefined") {
          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({
            event: "contact_form_submit",
            form_type: "tube_quote",
            user_email: email,
            form_location: FORM_LOCATION,
          })
        }
        captureEvent("contact_form_submitted", {
          form_location: FORM_LOCATION,
          form_type: "tube_quote",
          email,
          skus: chosen.map((o) => o.sku),
          num_attachments: attachments.length,
        })
        identifyUser(email, {
          email,
          first_name: name,
          last_name: lastName,
          phone,
          company,
        })
        setStatus("success")
        setSelected([])
        setAttachedFiles([])
        formRef.current?.reset()
      } else {
        setStatus("error")
      }
    } catch (error) {
      console.error("Tube quote form error:", error)
      setStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "w-full bg-gray-100 border-0 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm outline-none transition-all duration-150 focus:ring-1 focus:ring-gray-900 focus:bg-white"
  const labelClass = "block text-xs text-gray-500 mb-1.5"

  return (
    <div>
      {status === "success" && (
        <div
          role="status"
          className="mb-6 p-4 text-sm font-light"
          style={{ backgroundColor: "rgba(227,0,15,0.05)", border: "1px solid rgba(227,0,15,0.15)", borderRadius: "5px", color: "#111" }}
        >
          ✓ Quote request sent. Pricing comes back within 48 hours.
        </div>
      )}
      {status === "error" && (
        <div
          role="alert"
          className="mb-6 p-4 text-sm font-light"
          style={{ backgroundColor: "rgba(227,0,15,0.05)", border: "1px solid rgba(227,0,15,0.15)", borderRadius: "5px", color: "#E3000F" }}
        >
          Something went wrong. Please try again or email us directly.
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" data-testid="tube-quote-form">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tq-name" className={labelClass}>First Name</label>
            <input id="tq-name" type="text" name="name" required autoComplete="given-name" placeholder="First Name" className={inputClass} style={{ borderRadius: "5px" }} />
          </div>
          <div>
            <label htmlFor="tq-last" className={labelClass}>Last Name</label>
            <input id="tq-last" type="text" name="lastName" required autoComplete="family-name" placeholder="Last Name" className={inputClass} style={{ borderRadius: "5px" }} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tq-email" className={labelClass}>Work Email</label>
            <input id="tq-email" type="email" name="email" required autoComplete="email" placeholder="name@company.com" className={inputClass} style={{ borderRadius: "5px" }} />
          </div>
          <div>
            <label htmlFor="tq-phone" className={labelClass}>Phone (optional)</label>
            <input id="tq-phone" type="tel" name="phone" autoComplete="tel" placeholder="(555) 123-4567" className={inputClass} style={{ borderRadius: "5px" }} />
          </div>
        </div>

        <div>
          <label htmlFor="tq-company" className={labelClass}>Company (optional)</label>
          <input id="tq-company" type="text" name="company" autoComplete="organization" placeholder="Company name" className={inputClass} style={{ borderRadius: "5px" }} />
        </div>

        {bySize.length > 0 && (
          <fieldset>
            <legend className={labelClass}>Sizes &amp; alloys (tick all that apply)</legend>
            <div
              className="max-h-64 overflow-y-auto p-3 space-y-2 bg-gray-100"
              style={{ borderRadius: "5px" }}
            >
              {bySize.map(([size, group]) => (
                <div key={size} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="text-xs font-medium w-full sm:w-44" style={{ color: "#111111" }}>
                    {size}
                  </span>
                  {group.map((o) => (
                    <label key={o.sku} className="inline-flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: "#374151" }}>
                      <input
                        type="checkbox"
                        checked={selected.includes(o.sku)}
                        onChange={() => toggle(o.sku)}
                        className="accent-[#E3000F]"
                      />
                      {o.alloy}
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </fieldset>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="tq-qty" className={labelClass}>Quantity (total feet or number of lengths)</label>
            <input id="tq-qty" type="text" name="quantity" placeholder="e.g. 400 ft of 2&quot;" className={inputClass} style={{ borderRadius: "5px" }} />
          </div>
          <div>
            <label htmlFor="tq-ship" className={labelClass}>Ship-to city / ZIP</label>
            <input id="tq-ship" type="text" name="shipTo" autoComplete="postal-code" placeholder="e.g. Dallas, TX 75201" className={inputClass} style={{ borderRadius: "5px" }} />
          </div>
        </div>

        <div>
          <label htmlFor="tq-notes" className={labelClass}>Notes (other sizes, finish, cut lengths, delivery date)</label>
          <textarea id="tq-notes" name="notes" rows={4} placeholder="Anything else we should price..." className={`${inputClass} resize-none`} style={{ borderRadius: "5px" }} />
        </div>

        <AttachmentInput
          files={attachedFiles}
          onChange={setAttachedFiles}
          disabled={isSubmitting}
          label="Attachments (PO, drawing, BOM)"
          labelClassName={labelClass}
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 py-3 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
        >
          {isSubmitting ? "Sending…" : "Request a quote"}
        </button>
        <p className="text-xs font-light" style={{ color: "#9ca3af" }}>
          Pricing within 48 hours. Quotes are held for 90 days. No minimums.
        </p>
      </form>
    </div>
  )
}
