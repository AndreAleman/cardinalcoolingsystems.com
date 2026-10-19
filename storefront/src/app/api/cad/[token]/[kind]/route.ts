// CAD file download proxy (ported from Sanitube). The backend's file route needs the publishable
// key, so browsers download through this same-origin route and never see a backend or bucket URL.
// Lives outside [countryCode], so the region middleware skips it.

import { cadProxyErrorMessage, isCadFileKind, isPlausibleCadToken } from "@lib/builder/cad"
import { trustHeaders } from "@lib/data/storefront-trust"

export const dynamic = "force-dynamic"

const BACKEND_URL = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const PASS_THROUGH = ["content-type", "content-length", "content-disposition", "etag", "last-modified"]

const textResponse = (status: number) =>
  new Response(cadProxyErrorMessage(status), {
    status,
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "private, no-store", "x-robots-tag": "noindex" },
  })

export async function GET(_req: Request, ctx: { params: { token: string; kind: string } }) {
  const { token, kind } = ctx.params
  if (!isPlausibleCadToken(token) || !isCadFileKind(kind)) return textResponse(404)

  let upstream: Response
  try {
    upstream = await fetch(`${BACKEND_URL}/store/cad-downloads/${encodeURIComponent(token)}/files/${kind}`, {
      method: "GET",
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY, ...trustHeaders() },
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    })
  } catch (err) {
    console.error("cad download proxy failed:", (err as Error)?.message ?? "unknown")
    return textResponse(502)
  }

  if (!upstream.ok || !upstream.body) {
    await upstream.body?.cancel().catch(() => {})
    return textResponse(upstream.ok ? 502 : upstream.status)
  }

  const headers = new Headers({ "cache-control": "private, no-store", "x-content-type-options": "nosniff", "x-robots-tag": "noindex" })
  for (const name of PASS_THROUGH) {
    const v = upstream.headers.get(name)
    if (v) headers.set(name, v)
  }
  if (!headers.has("content-disposition")) headers.set("content-disposition", `attachment; filename="cad.${kind}"`)
  return new Response(upstream.body, { status: upstream.status, headers })
}
