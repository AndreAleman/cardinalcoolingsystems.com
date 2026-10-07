"use client"

import { useCallback, useEffect, useRef } from "react"

/*
  Bot protection for a form: a Cloudflare Turnstile challenge plus a
  honeypot. The backend enforces both (utils/abuse-policy.ts).

  Performance: cold-email landing pages must stay fast, so NOTHING loads
  until the visitor first touches the form. The widget is
  "interaction-only": invisible unless Cloudflare wants a click.

  No NEXT_PUBLIC_TURNSTILE_SITE_KEY → no widget (the backend skips the
  check when its secret is unset too). The honeypot still works.

  Two ways to use it:
   - server-action form: drop <BotGuard /> inside the <form>. Turnstile
     adds a hidden "cf-turnstile-response" input that rides in FormData.
   - fetch form: const guard = useBotGuard(); render {guard.field}
     inside the form and spread `await guard.values()` into the body.
*/

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

let scriptPromise: Promise<void> | null = null
function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script")
      s.src = SCRIPT_SRC
      s.async = true
      s.defer = true
      s.onload = () => resolve()
      s.onerror = () => {
        scriptPromise = null
        reject(new Error("Turnstile failed to load"))
      }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

export type BotGuardValues = {
  turnstile_token?: string
  website: string
  elapsed_ms: number
}

export function useBotGuard() {
  const holder = useRef<HTMLDivElement | null>(null)
  const trap = useRef<HTMLInputElement | null>(null)
  const widgetId = useRef<string | null>(null)
  const token = useRef<string | null>(null)
  const waiters = useRef<((t: string | null) => void)[]>([])
  const startedAt = useRef<number>(Date.now())
  const started = useRef(false)

  const settle = (t: string | null) => {
    token.current = t
    waiters.current.splice(0).forEach((w) => w(t))
  }

  const start = useCallback(() => {
    if (started.current || !SITE_KEY) return
    started.current = true
    loadTurnstile()
      .then(() => {
        if (!holder.current || !window.turnstile || widgetId.current) return
        widgetId.current = window.turnstile.render(holder.current, {
          sitekey: SITE_KEY,
          appearance: "interaction-only",
          size: "flexible",
          callback: (t: string) => settle(t),
          "expired-callback": () => {
            token.current = null
          },
          "error-callback": () => settle(null),
        })
      })
      .catch(() => settle(null))
  }, [])

  // Arm on first touch of the surrounding form; reset after each submit
  // (a Turnstile token works once).
  useEffect(() => {
    startedAt.current = Date.now()
    const form = holder.current?.closest("form")
    if (!form) return
    const onTouch = () => start()
    const onSubmit = () => {
      window.setTimeout(() => {
        token.current = null
        if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
      }, 1500)
    }
    form.addEventListener("focusin", onTouch)
    form.addEventListener("pointerdown", onTouch)
    form.addEventListener("submit", onSubmit)
    return () => {
      form.removeEventListener("focusin", onTouch)
      form.removeEventListener("pointerdown", onTouch)
      form.removeEventListener("submit", onSubmit)
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current)
        widgetId.current = null
      }
    }
  }, [start])

  /* For fetch forms. Waits (briefly) for a token still being minted. */
  const values = useCallback(async (): Promise<BotGuardValues> => {
    const base = {
      website: trap.current?.value ?? "",
      elapsed_ms: Date.now() - startedAt.current,
    }
    if (!SITE_KEY) return base
    start()
    const t =
      token.current ??
      (await new Promise<string | null>((resolve) => {
        waiters.current.push(resolve)
        window.setTimeout(() => resolve(null), 10_000)
      }))
    return t ? { ...base, turnstile_token: t } : base
  }, [start])

  /* Call after a fetch submit: the token is spent. */
  const reset = useCallback(() => {
    token.current = null
    if (widgetId.current && window.turnstile) window.turnstile.reset(widgetId.current)
  }, [])

  const field = (
    <>
      {/* Honeypot: off-screen, not display:none (bots skip those), out of
          the tab order and hidden from assistive tech. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", left: "-10000px", top: "auto", width: 1, height: 1, overflow: "hidden" }}
      >
        <label>
          Website
          <input ref={trap} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <div ref={holder} data-testid="bot-guard" />
    </>
  )

  return { field, values, reset }
}

/* For server-action forms. */
export default function BotGuard() {
  return useBotGuard().field
}
