"use client"

import { useState } from "react"
import { btnSecondary } from "../portal-ui"

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
      className="rounded-[5px] border p-4 flex flex-col small:flex-row small:items-center justify-between gap-3"
      style={{
        borderColor: "rgba(227, 0, 15, 0.15)",
        backgroundColor: "rgba(227, 0, 15, 0.04)",
      }}
      data-testid="welcome-code-banner"
    >
      <div>
        <p
          className="text-[12px] font-medium uppercase tracking-widest m-0"
          style={{ color: "#E3000F" }}
        >
          Your welcome code — 10% off your first order, any size, works once
        </p>
        <p
          className="text-2xl font-semibold tracking-wider m-0 mt-0.5 text-[#111111]"
          data-testid="welcome-code"
          data-value={code}
        >
          {code}
        </p>
      </div>
      <button
        type="button"
        onClick={copy}
        className={btnSecondary}
        data-testid="copy-welcome-code"
      >
        {copied ? "Copied" : "Copy code"}
      </button>
    </div>
  )
}

export default WelcomeCodeBanner
