const POSTHOG_HOST = process.env.POSTHOG_HOST || "https://us.i.posthog.com"

/**
 * Server-side PostHog capture via the HTTP /capture API (no SDK dependency).
 * No-ops when POSTHOG_API_KEY is not set.
 */
export async function capturePosthogEvent(
  event: string,
  distinctId: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  const apiKey = process.env.POSTHOG_API_KEY

  if (!apiKey) {
    console.warn(`[PostHog] POSTHOG_API_KEY is not set, skipping event: ${event}`)
    return
  }

  const res = await fetch(`${POSTHOG_HOST}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      event,
      distinct_id: distinctId,
      properties,
      timestamp: new Date().toISOString(),
    }),
  })

  if (!res.ok) {
    throw new Error(`PostHog capture failed: ${res.status} ${await res.text()}`)
  }
}
