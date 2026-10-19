"use client"

// The Spec Block: a paste-ready submittal paragraph with a Copy button.

import { useState } from "react"

export default function SpecBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }
  return (
    <section aria-label="Spec Block" className="border border-neutral-200 bg-white p-4" data-testid="spec-block">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">Spec Block</h2>
        <button
          type="button"
          onClick={copy}
          className="border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:border-neutral-900"
          data-testid="spec-block-copy"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-1 text-xs text-neutral-500">Paste it into your submittal.</p>
      <p className="mt-3 whitespace-pre-line bg-neutral-50 p-3 font-mono text-[13px] leading-relaxed text-neutral-800" data-testid="spec-block-text">
        {text}
      </p>
    </section>
  )
}
