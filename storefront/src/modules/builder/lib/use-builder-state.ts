"use client"

// Builder state shared by the five builders (ported from Sanitube use-builder-state.ts): the
// options, their local derivations (Part Number, description, BOM, weight, Spec Block, lead time,
// Standard Range), the live resolve, adopting a new Share Link on client navigation, and keeping
// the address bar a Share Link (history.replaceState, debounced, no RSC round-trip).

import { getBuilder, type BuilderType, type Options, type OptionValue } from "@lib/cpq/shared"
import { applyOptionChange, isUrlInSync, syncedUrlFor } from "@lib/builder/state"
import { captureEvent } from "@lib/util/posthog"
import { useEffect, useMemo, useRef, useState } from "react"
import { useBuildResolve } from "./use-build-resolve"

export const URL_SYNC_DEBOUNCE_MS = 300

export function useBuilderState(type: BuilderType, initialOptions: Options) {
  const builder = getBuilder(type as string)
  const [options, setOptions] = useState<Options>(initialOptions)
  const [error, setError] = useState<{ key: string; message: string } | null>(null)
  const configured = useRef(false)

  const key = builder.configKey(options)
  const local = useMemo(
    () => ({
      partNumber: builder.partNumber(options),
      description: builder.describe(options),
      weightLb: builder.weight(options).per_unit_lb,
      specBlock: builder.specBlock(options),
      leadTime: builder.leadTime(options),
      standardRange: builder.standardRange(options),
      bom: builder.bom(options),
      display: builder.display(options),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  )

  const { status, result, retry } = useBuildResolve(type, options, key)

  // A client navigation to a different Share Link re-renders the page with new props: adopt it.
  const initialKey = builder.configKey(initialOptions)
  useEffect(() => {
    setOptions((current) => (builder.configKey(current) === initialKey ? current : initialOptions))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey])

  // Keep the address bar a Share Link.
  useEffect(() => {
    const t = setTimeout(() => {
      if (isUrlInSync(window.location.href, type, options)) return
      window.history.replaceState(window.history.state, "", syncedUrlFor(window.location.href, type, options))
    }, URL_SYNC_DEBOUNCE_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  /** Applies one change (with dependent defaults); keeps the message when it isn't valid. */
  const change = (k: string, value: OptionValue, pricingMode: "instant" | "quote") => {
    const res = applyOptionChange(type, options, k, value)
    if (!res.ok) {
      setError({ key: k, message: res.error })
      return
    }
    setError(null)
    setOptions(res.options)
    if (!configured.current) {
      configured.current = true
      captureEvent("builder_configured", { builder_type: type, pricing_mode: pricingMode, option: k })
    }
  }

  return { builder, options, key, local, status, result, retry, change, error }
}
