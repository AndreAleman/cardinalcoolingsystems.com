export const CONSENT_KEY = "cardinal_cookie_consent"
export const CONSENT_EVENT = "cardinal-cookie-consent-changed"

export type ConsentValue = "accepted" | "declined"

export function getConsent(): ConsentValue | null {
  if (typeof window === "undefined") return null
  try {
    const value = window.localStorage.getItem(CONSENT_KEY)
    return value === "accepted" || value === "declined" ? value : null
  } catch {
    return null
  }
}

export function setConsent(value: ConsentValue) {
  try {
    window.localStorage.setItem(CONSENT_KEY, value)
  } catch {
    // storage unavailable (private mode) — banner will just reappear next visit
  }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}
