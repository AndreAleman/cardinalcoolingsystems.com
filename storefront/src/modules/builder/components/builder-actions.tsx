"use client"

// Actions under the Part Number card (ported from Sanitube sweep-builder/actions.tsx): the strong
// full-width "Add to Quote List" CTA, Share (copy the Share Link) and a jump to the CAD panel. On
// mobile a sticky bar (Part Number + the same CTA) shows while the main button is off screen.

import type { BuilderType, Options } from "@lib/cpq/shared"
import { addBuildToQuoteList } from "@lib/data/builder"
import { shareUrlFor } from "@lib/builder/state"
import { notifyCartUpdated } from "@lib/hooks/use-cart-count"
import { captureEvent } from "@lib/util/posthog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@medusajs/ui"
import { useParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const ctaClass =
  "inline-flex items-center justify-center gap-2 bg-cardinal-red px-6 font-semibold text-white transition-colors hover:bg-cardinal-red-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cardinal-red focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
const secondaryCls =
  "inline-flex min-h-[40px] items-center justify-center border border-neutral-300 bg-white px-4 text-sm font-semibold text-neutral-900 hover:border-neutral-900"

function scrollToCadPanel() {
  document.querySelector<HTMLElement>('[data-testid="cad-panel"]')?.scrollIntoView({ behavior: "smooth", block: "start" })
}

export type BuilderActionsProps = {
  type: BuilderType
  options: Options
  partNumber: string
  pricingMode: "instant" | "quote"
  cadLabel: string
}

export default function BuilderActions({ type, options, partNumber, pricingMode, cadLabel }: BuilderActionsProps) {
  const params = useParams() as { countryCode?: string }
  const countryCode = (params?.countryCode || "us").toLowerCase()
  const [adding, setAdding] = useState(false)
  const [status, setStatus] = useState<{ tone: "ok" | "error" | "info"; text: string; link?: boolean } | null>(null)
  const mainRef = useRef<HTMLButtonElement>(null)
  const [mainVisible, setMainVisible] = useState(true)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = mainRef.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([entry]) => setMainVisible(entry.isIntersecting), { threshold: 0 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // While the sticky bar shows, pad the page bottom by its height so it never covers the footer.
  useEffect(() => {
    const bar = barRef.current
    if (mainVisible || !bar) return
    const body = document.body
    const before = body.style.paddingBottom
    const apply = () => {
      body.style.paddingBottom = bar.offsetHeight > 0 ? `${bar.offsetHeight}px` : before
    }
    apply()
    window.addEventListener("resize", apply)
    return () => {
      window.removeEventListener("resize", apply)
      body.style.paddingBottom = before
    }
  }, [mainVisible])

  // A new configuration clears the last message.
  const key = JSON.stringify(options)
  useEffect(() => setStatus(null), [key])

  const onAdd = async () => {
    setAdding(true)
    setStatus(null)
    try {
      const res = await addBuildToQuoteList({
        builderType: type,
        options,
        countryCode,
        sourcePage: window.location.pathname + window.location.search,
      })
      if (!res.ok) {
        setStatus({ tone: "error", text: res.message })
        return
      }
      notifyCartUpdated()
      const d = res.data
      captureEvent("builder_add_to_quote", {
        builder_type: type,
        pricing_mode: d.pricing_mode || pricingMode,
        part_number: d.part_number || partNumber,
        configuration_id: d.configuration_id,
        lines: d.added?.length ?? 0,
      })
      const shortLines = (d.added ?? []).filter((a) => a.kind === "quote_only").length
      setStatus({
        tone: "ok",
        text:
          `Added ${d.part_number || partNumber} to your Quote List.` +
          (d.pricing_mode === "quote" ? " We'll price it within 1 business day of your request." : "") +
          (shortLines ? ` ${shortLines} part${shortLines === 1 ? " is" : "s are"} short on stock and will be quoted.` : ""),
        link: true,
      })
    } finally {
      setAdding(false)
    }
  }

  const onShare = async () => {
    const url = shareUrlFor(window.location.href, type, options)
    captureEvent("builder_share", { builder_type: type, pricing_mode: pricingMode, part_number: partNumber })
    try {
      await navigator.clipboard.writeText(url)
      setStatus({ tone: "info", text: "Link copied. Anyone with it sees this exact configuration." })
    } catch {
      setStatus({ tone: "info", text: url })
    }
  }

  return (
    <section aria-label="Add this configuration" className="flex flex-col gap-3 border border-neutral-200 bg-white p-4 xsmall:p-5" data-testid="builder-actions">
      <button ref={mainRef} type="button" className={clx(ctaClass, "h-14 w-full text-base")} disabled={adding} onClick={onAdd} data-testid="add-to-quote">
        {adding ? "Adding…" : "Add to Quote List"}
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className={secondaryCls} onClick={onShare} data-testid="share-configuration">
          Share
        </button>
        <button type="button" className={clx(secondaryCls, "ml-auto")} onClick={scrollToCadPanel} data-testid="cad-jump">
          CAD files ({cadLabel}) <span aria-hidden className="ml-1">↓</span>
        </button>
      </div>
      <div aria-live="polite">
        {status ? (
          <p
            className={clx(
              "text-sm",
              status.tone === "ok" && "text-emerald-800",
              status.tone === "error" && "text-cardinal-red",
              status.tone === "info" && "break-all text-neutral-700",
            )}
            data-testid="builder-actions-status"
          >
            {status.text}{" "}
            {status.link ? (
              <LocalizedClientLink href="/cart" className="font-semibold underline">
                View Quote List
              </LocalizedClientLink>
            ) : null}
          </p>
        ) : (
          <p className="text-xs text-neutral-500">
            {pricingMode === "instant"
              ? "Stocked parts: check out from your Quote List, or send it for a quote."
              : "Send your Quote List and we reply with a firm price within 1 business day."}
          </p>
        )}
      </div>

      {/* Mobile only: Part Number + CTA while the main button is off screen. */}
      <div
        ref={barRef}
        className={clx(
          "fixed inset-x-0 bottom-0 z-40 border-t border-neutral-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur small:hidden",
          mainVisible && "hidden",
        )}
        data-testid="sticky-add-bar"
        aria-hidden={mainVisible}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Part Number</p>
            <p className="truncate font-mono text-sm font-semibold text-neutral-900">{partNumber}</p>
          </div>
          <button
            type="button"
            className={clx(ctaClass, "h-11 shrink-0 px-4 text-sm")}
            disabled={adding}
            onClick={onAdd}
            tabIndex={mainVisible ? -1 : 0}
            data-testid="add-to-quote-sticky"
          >
            {adding ? "Adding…" : "Add to Quote List"}
          </button>
        </div>
      </div>
    </section>
  )
}
