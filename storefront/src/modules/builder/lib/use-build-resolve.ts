"use client"

// Live resolve (ported from Sanitube use-configuration-resolve.ts): debounced on the config key,
// memoized per key for the page session, stale responses dropped with a request counter (server
// actions are queued per client, so an older response can land after a newer change). A result is
// only returned while it belongs to the current key. The first resolve of the page fires at once.

import type { BuilderType, Options } from "@lib/cpq/shared"
import { resolveBuild } from "@lib/data/builder"
import type { ResolveStatus } from "@lib/builder/pricing-view"
import type { ResolveResponse } from "@lib/builder/types"
import { useEffect, useRef, useState } from "react"

export const RESOLVE_DEBOUNCE_MS = 350

export function useBuildResolve(type: BuilderType, options: Options, key: string) {
  const cache = useRef<Map<string, ResolveResponse>>(new Map())
  const requestId = useRef(0)
  const first = useRef(true)
  const [attempt, setAttempt] = useState(0)
  const [state, setState] = useState<{ key: string | null; status: ResolveStatus; result: ResolveResponse | null }>({
    key: null,
    status: "idle",
    result: null,
  })

  useEffect(() => {
    const id = ++requestId.current
    const hit = cache.current.get(key)
    if (hit) {
      setState({ key, status: "done", result: hit })
      return
    }
    setState({ key, status: "loading", result: null })
    const delay = first.current ? 0 : RESOLVE_DEBOUNCE_MS
    first.current = false
    const timer = setTimeout(() => {
      resolveBuild(type, options)
        .then((res) => {
          if (res.ok) cache.current.set(key, res.data)
          if (id !== requestId.current) return
          setState(res.ok ? { key, status: "done", result: res.data } : { key, status: "error", result: null })
        })
        .catch(() => {
          if (id === requestId.current) setState({ key, status: "error", result: null })
        })
    }, delay)
    return () => clearTimeout(timer)
    // `options` always matches `key`; keying on the string avoids re-running for equal options.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  const fresh = state.key === key
  return {
    status: (fresh ? state.status : "loading") as ResolveStatus,
    result: fresh ? state.result : null,
    retry: () => setAttempt((n) => n + 1),
  }
}
