/**
 * Thin, SSR-safe wrapper around the PostHog snippet (`window.posthog`).
 *
 * PostHog is installed via the inline JS snippet in `app/layout.tsx`, so there
 * is no `posthog-js` npm import — events go through the global `window.posthog`.
 * The snippet installs a stub queue, so calls made before `array.js` finishes
 * loading are queued and replayed. Calls are also safe no-ops when
 * `NEXT_PUBLIC_POSTHOG_KEY` is unset (the snippet isn't injected, so
 * `window.posthog` is `undefined`).
 */

type PostHogLite = {
  capture: (event: string, properties?: Record<string, unknown>) => void
  identify: (distinctId: string, properties?: Record<string, unknown>) => void
  reset: () => void
}

declare global {
  interface Window {
    posthog?: PostHogLite
  }
}

/** Capture a custom event. Client-only; no-op during SSR. */
export function captureEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined") return
  window.posthog?.capture(event, properties)
}

/**
 * Tie subsequent events to a known person — a logged-in customer (id) or an
 * anonymous lead (email). Because the snippet uses `person_profiles:
 * 'identified_only'`, this is what creates the person profile in PostHog.
 */
export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>
) {
  if (typeof window === "undefined" || !distinctId) return
  window.posthog?.identify(distinctId, properties)
}

/** Clear the current identity. Call on logout. */
export function resetAnalytics() {
  if (typeof window === "undefined") return
  window.posthog?.reset()
}
