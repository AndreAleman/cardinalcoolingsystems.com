"use client"

import { useState } from "react"

type Props = { code: string }

/* The Welcome Code, big, with a copy button. The backend stops reporting it once used or expired. */
const WelcomeCodeBanner = ({ code }: Props) => {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the code is still visible to select by hand */
    }
  }

  return (
    <div
      className="rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col small:flex-row small:items-center justify-between gap-3"
      data-testid="welcome-code-banner"
    >
      <div>
        <p className="text-small-regular text-ui-fg-subtle m-0">
          Your welcome code — 10% off your first order, any size, works once
        </p>
        <p
          className="text-2xl font-semibold tracking-wider m-0"
          data-testid="welcome-code"
          data-value={code}
        >
          {code}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        className="px-4 py-2 rounded-md bg-gray-900 text-white text-small-regular"
        data-testid="copy-welcome-code"
      >
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  )
}

export default WelcomeCodeBanner
