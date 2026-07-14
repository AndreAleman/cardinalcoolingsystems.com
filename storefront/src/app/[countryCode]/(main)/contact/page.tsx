"use client"

import Link from "next/link"
import { useState, FormEvent, useRef } from "react"
import { filesToAttachments } from "@lib/util/attachments"
import AttachmentInput from "@modules/common/components/attachment-input"

declare global {
  interface Window {
    dataLayer: any[]
  }
}

interface Props {
  params: { countryCode: string }
}

const faqs = [
  {
    q: "What industries do you serve?",
    a: "We serve food processing, pharmaceuticals, brewing & beverage, biotechnology, and general industrial applications requiring sanitary stainless steel components.",
  },
  {
    q: "Do you offer custom fabrication?",
    a: "Yes, we work with trusted fabrication partners to provide custom solutions when standard fittings don't meet your specific requirements.",
  },
  {
    q: "What are your minimum order quantities?",
    a: "We accommodate both small prototype orders and large production runs. Contact us for specific quantities and pricing.",
  },
]

export default function ContactPage({ params }: Props) {
  const { countryCode } = params
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
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
      message: formData.get("message") as string,
    }

    try {
      const attachments = await filesToAttachments(attachedFiles)

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
          body: JSON.stringify(
            attachments.length > 0 ? { ...data, attachments } : data
          ),
        }
      )

      if (response.ok) {
        if (typeof window !== "undefined") {
          window.dataLayer = window.dataLayer || []
          window.dataLayer.push({
            event: "contact_form_submit",
            form_type: "general_contact",
            user_email: data.email,
            form_location: "contact_page",
          })
        }
        setSubmitStatus("success")
        setAttachedFiles([])
        formRef.current?.reset()
      } else {
        setSubmitStatus("error")
      }
    } catch (error) {
      console.error("Contact form error:", error)
      setSubmitStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputClass =
    "w-full bg-gray-100 border-0 text-gray-900 placeholder-gray-400 px-4 py-3 text-sm outline-none transition-all duration-150 focus:ring-1 focus:ring-gray-900 focus:bg-white"

  const iconBox = (
    <div
      className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ backgroundColor: "rgba(227,0,15,0.08)", borderRadius: "5px" }}
    />
  )

  return (
    <div className="bg-white">

      {/* ── Main section: info left, form right ─────────────────────────── */}
      <section className="pt-36 pb-24 px-6 lg:px-12 bg-white">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

            {/* Left — headline + contact info */}
            <div>
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm mb-10" style={{ color: "#9ca3af" }}>
                <Link href={`/${countryCode}`} className="hover:text-gray-900 transition-colors">Home</Link>
                <span>/</span>
                <span className="text-gray-900">Contact Us</span>
              </nav>

              <h1 className="font-sans text-4xl lg:text-5xl font-normal tracking-tight mb-4" style={{ color: "#111111" }}>
                Get Expert Guidance
              </h1>
              <p className="text-sm font-light leading-relaxed mb-12 max-w-sm" style={{ color: "#6b7280" }}>
                Our technical experts are here to help you find the perfect sanitary fitting solution for your specific application. Contact us today.
              </p>

              {/* Contact items */}
              <div className="space-y-8">

                {/* Phone */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">Call Us</p>
                    <p className="text-xs text-gray-400 mb-1">Speak directly with our technical experts</p>
                    <a href="tel:+16309479955" className="text-sm font-medium transition-colors" style={{ color: "#E3000F" }}>
                      (630) 947-9955
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest">Mon–Fri 8:00 AM – 6:00 PM EST</p>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">Our Address</p>
                    <p className="text-sm font-light" style={{ color: "#6b7280" }}>
                      333 S.E. 2nd Avenue, Suite 2000<br />
                      Miami, FL 33131<br />
                      United States
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-0.5">Email Us</p>
                    <p className="text-xs text-gray-400 mb-1">Send us your technical questions</p>
                    <a href="mailto:aleman@cardinalcoolingsystems.com" className="text-sm font-medium transition-colors" style={{ color: "#E3000F" }}>
                      aleman@cardinalcoolingsystems.com
                    </a>
                    <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-widest">We respond within 24 hours</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right — form */}
            <div>
              <h2 className="font-sans text-2xl font-normal tracking-tight mb-8" style={{ color: "#111111" }}>
                Contact Us
              </h2>

              {submitStatus === "success" && (
                <div className="mb-6 p-4 text-sm font-light" style={{ backgroundColor: "rgba(227,0,15,0.05)", border: "1px solid rgba(227,0,15,0.15)", borderRadius: "5px", color: "#111" }}>
                  ✓ Message sent. We'll follow up within one business day.
                </div>
              )}
              {submitStatus === "error" && (
                <div className="mb-6 p-4 text-sm font-light" style={{ backgroundColor: "rgba(227,0,15,0.05)", border: "1px solid rgba(227,0,15,0.15)", borderRadius: "5px", color: "#E3000F" }}>
                  Something went wrong. Please try again.
                </div>
              )}

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

                {/* Name row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">First Name</label>
                    <input type="text" name="name" required placeholder="First Name" className={inputClass} style={{ borderRadius: "5px" }} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Last Name</label>
                    <input type="text" name="lastName" required placeholder="Last Name" className={inputClass} style={{ borderRadius: "5px" }} />
                  </div>
                </div>

                {/* Email + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Work Email</label>
                    <input type="email" name="email" required placeholder="name@company.com" className={inputClass} style={{ borderRadius: "5px" }} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1.5">Phone (optional)</label>
                    <input type="tel" name="phone" placeholder="(555) 123-4567" className={inputClass} style={{ borderRadius: "5px" }} />
                  </div>
                </div>

                {/* Specifications */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Specifications</label>
                  <textarea
                    name="message"
                    required
                    rows={5}
                    placeholder="Details regarding pressure, fittings, and estimated quantity..."
                    className={`${inputClass} resize-none`}
                    style={{ borderRadius: "5px" }}
                  />
                </div>

                {/* Attachments */}
                <AttachmentInput
                  files={attachedFiles}
                  onChange={setAttachedFiles}
                  disabled={isSubmitting}
                  labelClassName="block text-xs text-gray-500 mb-1.5"
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-3 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F")}
                >
                  {isSubmitting ? "Sending…" : "Send Message"}
                  {!isSubmitting && (
                    <span
                      className="flex items-center justify-center w-6 h-6"
                      style={{ backgroundColor: "rgba(0,0,0,0.15)", borderRadius: "4px" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                        <path d="M2 12L12 2M12 2H5M12 2v7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </button>

              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ section ──────────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 bg-white border-t" style={{ borderColor: "#f0f0f0" }}>
        <div className="mx-auto max-w-[1440px]">
          <h2 className="font-sans text-3xl font-normal tracking-tight mb-12" style={{ color: "#111111" }}>
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="p-8 flex flex-col gap-4"
                style={{ backgroundColor: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "5px" }}
              >
                {/* Question mark icon */}
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "#111111" }}>{faq.q}</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#6b7280" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}
