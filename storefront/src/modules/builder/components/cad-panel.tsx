"use client"

// CAD panel (ported from Sanitube sweep-builder/cad-downloads, B7/B8). STEP + PDF for the
// transition and manifold; PDF only for the kit, strainer and hose ("STEP files for the stocked
// parts on request"). Gate: name, company, work email (client-side free-mail check; the backend is
// authoritative), honeypot + Turnstile through the bot guard. CAD Review is on: the outcome is
// normally "review", and the link is emailed once engineering approves the drawing.
// The parent keys this component on the config key, so any change resets it.

import type { BuilderType, Options } from "@lib/cpq/shared"
import { CAD_MESSAGES, cadFileLabel, cadFileUrl, cadKindsFor, cadReference, cadReviewMessage, validateCadContact } from "@lib/builder/cad"
import type { CadRequestResult } from "@lib/builder/types"
import { requestCadFiles } from "@lib/data/builder"
import { BUSINESS_EMAIL_MESSAGE, isBusinessEmail } from "@lib/util/business-email"
import { captureEvent } from "@lib/util/posthog"
import { useBotGuard } from "@modules/common/components/bot-guard"
import { type FormEvent, useState } from "react"

export type CadPanelProps = {
  type: BuilderType
  options: Options
  partNumber: string
  pricingMode: "instant" | "quote"
  /** Standard Range review reasons: CAD isn't offered outside the range. */
  reviewReasons: string[]
}

const inputCls =
  "mt-1.5 h-11 w-full border border-neutral-300 bg-white px-3 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
const labelCls = "block text-xs font-semibold uppercase tracking-wide text-neutral-600"

function Notice({ tone, children, testId }: { tone: "info" | "warn" | "ok"; children: React.ReactNode; testId?: string }) {
  const cls =
    tone === "ok"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : tone === "warn"
        ? "border-amber-300 bg-amber-50 text-amber-900"
        : "border-neutral-200 bg-neutral-50 text-neutral-800"
  return (
    <div role="status" className={`border px-3 py-2 text-sm ${cls}`} data-testid={testId}>
      {children}
    </div>
  )
}

export default function CadPanel({ type, options, partNumber, pricingMode, reviewReasons }: CadPanelProps) {
  const kinds = cadKindsFor(type)
  const label = kinds.map((k) => k.toUpperCase()).join(" + ")
  const [open, setOpen] = useState(false)
  const [result, setResult] = useState<CadRequestResult | null>(null)
  const [email, setEmail] = useState("")

  const header = (
    <>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-900">CAD files</h2>
      <p className="mt-1 text-sm text-neutral-600">
        {kinds.includes("step")
          ? "A 3D STEP model and a dimensioned PDF drawing of this configuration."
          : "A dimensioned PDF drawing with the bill of materials. STEP files for the stocked parts on request."}
      </p>
    </>
  )

  let body: React.ReactNode
  if (reviewReasons.length) {
    body = (
      <Notice tone="warn" testId="cad-outside-range">
        {CAD_MESSAGES.outside_standard_range}
      </Notice>
    )
  } else if (result?.ok) {
    if (result.outcome === "ready") {
      body = (
        <ul className="flex flex-wrap gap-2" data-testid="cad-ready">
          {kinds.map((k) => (
            <li key={k}>
              <a href={cadFileUrl(result.token, k)} download rel="nofollow" className="inline-flex items-center bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700">
                Download {cadFileLabel(k)}
              </a>
            </li>
          ))}
        </ul>
      )
    } else if (result.outcome === "blocked") {
      body = (
        <Notice tone="ok" testId="cad-review">
          {cadReviewMessage(email)}
        </Notice>
      )
    } else {
      const ref = cadReference(result.displayId)
      body = (
        <Notice tone="ok" testId={result.outcome === "review" ? "cad-review" : `cad-${result.outcome}`}>
          {result.outcome === "queued"
            ? "We're preparing these files. You'll get the link within 1 business day."
            : cadReviewMessage(result.email || email)}
          {ref ? ` (${ref})` : null}
        </Notice>
      )
    }
  } else if (!open) {
    body = (
      <div>
        <button
          type="button"
          className="inline-flex min-h-[44px] items-center border border-cardinal-red bg-white px-4 text-sm font-semibold text-cardinal-red hover:bg-cardinal-red hover:text-white"
          onClick={() => setOpen(true)}
          data-testid="cad-get-files"
        >
          Get CAD files ({label})
        </button>
      </div>
    )
  } else {
    body = (
      <CadRequestForm
        type={type}
        options={options}
        label={label}
        error={result && !result.ok ? result : null}
        onCancel={() => setOpen(false)}
        onResult={(res, sentTo) => {
          setEmail(sentTo)
          setResult(res)
          if (res.ok) {
            captureEvent("builder_cad_requested", {
              builder_type: type,
              pricing_mode: pricingMode,
              part_number: partNumber,
              kinds: kinds.join(","),
            })
          }
        }}
      />
    )
  }

  return (
    <section aria-label="CAD files" className="scroll-mt-28 border border-neutral-200 bg-white p-4 xsmall:p-5" data-testid="cad-panel">
      {header}
      <div className="mt-3 flex flex-col gap-3">{body}</div>
    </section>
  )
}

/** The gate form. Its own component so the bot guard arms on this <form> when it mounts. */
function CadRequestForm({
  type,
  options,
  label,
  error,
  onCancel,
  onResult,
}: {
  type: BuilderType
  options: Options
  label: string
  error: Extract<CadRequestResult, { ok: false }> | null
  onCancel: () => void
  onResult: (res: CadRequestResult, email: string) => void
}) {
  const guard = useBotGuard()
  const [pending, setPending] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [values, setValues] = useState({ name: "", company: "", email: "" })

  const checkEmail = (v: string) => {
    const t = v.trim()
    setEmailError(t && t.includes("@") && !isBusinessEmail(t) ? BUSINESS_EMAIL_MESSAGE : null)
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const check = validateCadContact(values)
    if (!check.ok) {
      onResult({ ok: false, code: "invalid", message: check.message }, values.email)
      return
    }
    setPending(true)
    try {
      const bot = await guard.values()
      const res = await requestCadFiles({
        builder_type: type,
        options,
        name: check.value.name,
        company: check.value.company,
        email: check.value.email,
        source_page: window.location.pathname + window.location.search,
        ...bot,
      })
      onResult(res, check.value.email)
    } finally {
      guard.reset()
      setPending(false)
    }
  }

  return (
    <form className="relative flex flex-col gap-3" onSubmit={onSubmit} data-testid="cad-request-form" noValidate>
      <div className="grid grid-cols-1 gap-3 xsmall:grid-cols-2">
        <label>
          <span className={labelCls}>Your name</span>
          <input
            className={inputCls}
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            data-testid="cad-name-input"
          />
        </label>
        <label>
          <span className={labelCls}>Company</span>
          <input
            className={inputCls}
            name="company"
            required
            maxLength={200}
            autoComplete="organization"
            value={values.company}
            onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
            data-testid="cad-company-input"
          />
        </label>
      </div>
      <label>
        <span className={labelCls}>Work email</span>
        <input
          className={inputCls}
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          value={values.email}
          onChange={(e) => {
            setValues((v) => ({ ...v, email: e.target.value }))
            if (emailError) checkEmail(e.target.value)
          }}
          onBlur={(e) => checkEmail(e.target.value)}
          data-testid="cad-email-input"
        />
      </label>
      {emailError ? (
        <p className="text-xs text-cardinal-red" data-testid="cad-email-error">
          {emailError}
        </p>
      ) : null}
      {guard.field}
      {error ? (
        <Notice tone="warn" testId={`cad-error-${error.code}`}>
          {error.message}
        </Notice>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center gap-2 bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
          disabled={pending || !!emailError}
          data-testid="cad-submit"
        >
          {pending ? "Sending…" : `Email me the ${label}`}
        </button>
        <button type="button" className="text-sm text-neutral-600 underline" onClick={onCancel}>
          Cancel
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        Engineering reviews every drawing before release. Reference only; certified drawings come with an approved quote.
      </p>
    </form>
  )
}
