"use client"

// Re-fetches the download page while the CAD package is being prepared (every 5 s, up to 2 min).

import { CAD_PREPARING_MAX_REFRESHES, CAD_PREPARING_REFRESH_MS } from "@lib/builder/cad"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function PreparingAutoRefresh() {
  const router = useRouter()
  const [count, setCount] = useState(0)
  const done = count >= CAD_PREPARING_MAX_REFRESHES

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => {
      router.refresh()
      setCount((c) => c + 1)
    }, CAD_PREPARING_REFRESH_MS)
    return () => clearTimeout(t)
  }, [count, done, router])

  return done ? (
    <p className="text-sm text-neutral-600">Still working on it. Refresh this page in a few minutes, or watch your inbox.</p>
  ) : (
    <p className="flex items-center gap-2 text-sm text-neutral-600" role="status">
      <span aria-hidden className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
      This page refreshes automatically.
    </p>
  )
}
