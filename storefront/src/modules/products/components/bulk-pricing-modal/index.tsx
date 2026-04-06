"use client"

import { useState, FormEvent, useRef } from "react"

declare global {
  interface Window {
    dataLayer: any[]
  }
}

interface BulkPricingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BulkPricingModal({ isOpen, onClose }: BulkPricingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      company: formData.get("company") as string,
      message: `${formData.get("message") as string} - from discount table`,
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
          body: JSON.stringify(data),
        }
      )

      if (response.ok) {
        if (typeof window !== "undefined") {
          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({
            event: "bulk_pricing_form_submit",
            form_type: "bulk_pricing",
            user_email: data.email,
            user_company: data.company,
            form_location: "product_page_discount_table",
          })
        }
        setSubmitStatus("success")
        formRef.current?.reset()
        setTimeout(() => {
          onClose()
          setSubmitStatus("idle")
        }, 2000)
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Bulk pricing inquiry error:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const inputClass =
    "w-full bg-gray-100 border-0 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm outline-none transition-all duration-150 focus:ring-1 focus:ring-gray-900 focus:bg-white"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-28" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="bg-white max-w-lg w-full max-h-[90vh] overflow-y-auto"
        style={{ borderRadius: "5px" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-normal tracking-widest uppercase mb-0.5" style={{ color: "#E3000F" }}>
              Volume Pricing
            </p>
            <h2 className="text-xl font-normal tracking-tight" style={{ color: "#111111" }}>
              Unlock Bulk Pricing
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 transition-colors hover:text-gray-900"
            style={{ color: "#9ca3af" }}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* Subtext */}
          <p className="text-sm font-light mb-5" style={{ color: "#6b7280" }}>
            Free shipping on orders $100+. Fill out the form below for exclusive B2B volume discounts.
          </p>

          {/* Blurred discount preview */}
          <div className="relative mb-6 overflow-hidden border border-gray-200" style={{ borderRadius: "5px" }}>
            <table className="w-full text-sm">
              <thead style={{ backgroundColor: "#f8f8f8" }}>
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "#6b7280" }}>Discount</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "#6b7280" }}>Qty</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "#6b7280" }}>Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="blur-sm select-none pointer-events-none">
                  <td className="px-4 py-2.5 font-semibold text-sm" style={{ color: "#E3000F" }}>5%</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: "#374151" }}>10+</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: "#374151" }}>$100+</td>
                </tr>
                <tr className="blur-sm select-none pointer-events-none">
                  <td className="px-4 py-2.5 font-semibold text-sm" style={{ color: "#E3000F" }}>??%</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: "#374151" }}>25+</td>
                  <td className="px-4 py-2.5 text-sm" style={{ color: "#374151" }}>$300+</td>
                </tr>
              </tbody>
            </table>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 bg-white border border-gray-200 shadow-sm text-sm font-medium" style={{ borderRadius: "5px", color: "#111111" }}>
                🔒 Submit the form to unlock
              </div>
            </div>
          </div>

          {/* Call us */}
          <div
            className="flex items-start gap-3 p-4 mb-5"
            style={{ backgroundColor: "rgba(227,0,15,0.04)", border: "1px solid rgba(227,0,15,0.12)", borderRadius: "5px" }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium mb-0.5" style={{ color: "#111111" }}>Prefer to talk now?</p>
              <p className="text-xs font-light mb-1.5" style={{ color: "#6b7280" }}>Call us directly for immediate assistance</p>
              <a href="tel:+16309479955" className="text-sm font-semibold transition-colors hover:opacity-80" style={{ color: "#E3000F" }}>
                (630) 947-9955
              </a>
            </div>
          </div>

          {/* Status messages */}
          {submitStatus === "success" && (
            <div className="mb-5 p-4 text-sm font-light" style={{ backgroundColor: "rgba(227,0,15,0.05)", border: "1px solid rgba(227,0,15,0.15)", borderRadius: "5px", color: "#111" }}>
              ✓ Request received. We'll contact you shortly with bulk pricing details.
            </div>
          )}
          {submitStatus === "error" && (
            <div className="mb-5 p-4 text-sm font-light" style={{ backgroundColor: "rgba(227,0,15,0.05)", border: "1px solid rgba(227,0,15,0.15)", borderRadius: "5px", color: "#E3000F" }}>
              Something went wrong. Please try again or call us directly.
            </div>
          )}

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7280" }}>First Name *</label>
                <input type="text" name="name" required placeholder="Jane" className={inputClass} style={{ borderRadius: "5px" }} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7280" }}>Last Name *</label>
                <input type="text" name="lastName" required placeholder="Smith" className={inputClass} style={{ borderRadius: "5px" }} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7280" }}>Email *</label>
              <input type="email" name="email" required placeholder="jane@company.com" className={inputClass} style={{ borderRadius: "5px" }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7280" }}>Company *</label>
              <input type="text" name="company" required placeholder="Acme Corp" className={inputClass} style={{ borderRadius: "5px" }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7280" }}>Phone <span className="font-light" style={{ color: "#9ca3af" }}>(optional)</span></label>
              <input type="tel" name="phone" placeholder="+1 (800) 000-0000" className={inputClass} style={{ borderRadius: "5px" }} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#6b7280" }}>Message</label>
              <textarea
                name="message"
                rows={3}
                placeholder="Tell us about your bulk order requirements..."
                className={`${inputClass} resize-none`}
                style={{ borderRadius: "5px" }}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
            >
              {isSubmitting ? "Sending…" : "Request Bulk Pricing →"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
