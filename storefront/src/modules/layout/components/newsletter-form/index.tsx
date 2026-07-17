"use client"

import { useState, FormEvent } from "react"
import { captureEvent, identifyUser } from "@lib/util/posthog"

// Footer email-capture form. Reuses the existing /store/contact lead-capture
// endpoint (which emails the team) so signups reach the same inbox as other
// leads without any new backend infrastructure.
export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus("loading")

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/contact`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!,
          },
          body: JSON.stringify({
            name: "Newsletter",
            lastName: "Signup",
            email,
            message: `Newsletter signup from the site footer: ${email}`,
          }),
        }
      )

      if (!res.ok) throw new Error("Subscribe failed")

      captureEvent("newsletter_subscribed", { form_location: "footer", email })
      identifyUser(email, { email, newsletter_subscriber: true })

      setStatus("success")
      setEmail("")
    } catch {
      setStatus("error")
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
        ✓ You're subscribed — we'll keep you posted.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        aria-label="Email address"
        className="w-full sm:w-72 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition-colors focus:border-white/50"
        style={{
          backgroundColor: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: "5px",
        }}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
        style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
      >
        {status === "loading" ? "Subscribing…" : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="text-xs self-center" style={{ color: "#f87171" }}>
          Something went wrong — please try again.
        </p>
      )}
    </form>
  )
}
