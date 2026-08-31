/*
  Buyer-portal analytics events.

  The storefront has no first-party PostHog SDK — analytics scripts load
  via GTM in app/layout.tsx — so we capture through window.posthog when
  a GTM-loaded PostHog is present AND mirror every event onto the GTM
  dataLayer (the pattern the existing contact-form events use). The
  contact-form events themselves are untouched.
*/

type PortalEventProps = Record<string, string | number | boolean | null>

export function capturePortalEvent(
  event:
    | "portal_order_placed"
    | "portal_quote_requested"
    | "portal_quote_accepted"
    | "po_uploaded",
  props: PortalEventProps
): void {
  if (typeof window === "undefined") return
  try {
    const w = window as any
    if (w.posthog?.capture) {
      w.posthog.capture(event, props)
    }
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({ event, ...props })
  } catch {
    // Analytics must never break the order flow.
  }
}
