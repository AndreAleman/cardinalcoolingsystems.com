import { NextRequest, NextResponse } from "next/server"

/**
 * First-party proxy for PostHog so ad blockers don't drop analytics.
 *
 * A plain next.config.js rewrite can't be used here: this site is behind
 * Cloudflare, and rewrites forward the incoming cf-* headers to PostHog,
 * whose own Cloudflare rejects the request with error 1000 ("DNS points
 * to prohibited IP"). This handler forwards with a clean header set.
 *
 * /ingest is excluded from the country-code middleware matcher.
 */

const INGEST_HOST = "https://us.i.posthog.com"
const ASSETS_HOST = "https://us-assets.i.posthog.com"

export const dynamic = "force-dynamic"

async function proxy(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join("/")
  const host = params.path[0] === "static" ? ASSETS_HOST : INGEST_HOST
  const url = `${host}/${path}${req.nextUrl.search}`

  const headers = new Headers()
  const contentType = req.headers.get("content-type")
  if (contentType) headers.set("content-type", contentType)
  const userAgent = req.headers.get("user-agent")
  if (userAgent) headers.set("user-agent", userAgent)
  // Preserve the visitor's IP for PostHog geolocation
  const clientIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  if (clientIp) headers.set("x-forwarded-for", clientIp)

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer()

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body,
    redirect: "manual",
  })

  // fetch decompresses the body, so drop encoding/length headers that
  // would no longer match it
  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")
  responseHeaders.delete("transfer-encoding")

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export {
  proxy as GET,
  proxy as POST,
  proxy as HEAD,
  proxy as OPTIONS,
  proxy as PUT,
  proxy as DELETE,
}
