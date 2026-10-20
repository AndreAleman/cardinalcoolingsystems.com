"use client"

// The one collapsed "Options" section under the primary questions. Defaults are preselected, so a
// buyer can skip it; the header summarizes the current choices ("TCS · hose · 36\" · no valves ·
// EPDM · 316L"). Opens by itself when one of its fields has an error.

import { clx } from "@medusajs/ui"
import { useEffect, useId, useState, type ReactNode } from "react"

export default function OptionsDisclosure({
  summary,
  children,
  forceOpen = false,
}: {
  summary: string
  children: ReactNode
  forceOpen?: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  useEffect(() => {
    if (forceOpen) setOpen(true)
  }, [forceOpen])
  return (
    <div className="border border-neutral-200" data-testid="builder-options" data-open={open}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[48px] w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
        data-testid="builder-options-toggle"
      >
        <span className="min-w-0 flex-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-900">Options</span>
          <span className="ml-2 text-sm text-neutral-600" data-testid="builder-options-summary">
            {summary}
          </span>
        </span>
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className={clx("h-4 w-4 shrink-0 text-neutral-500 transition-transform", open && "rotate-180")}
        >
          <path d="M3 6l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.75" />
        </svg>
      </button>
      <div id={id} hidden={!open} className="border-t border-neutral-200 px-3 pb-4 pt-4">
        {children}
      </div>
    </div>
  )
}
