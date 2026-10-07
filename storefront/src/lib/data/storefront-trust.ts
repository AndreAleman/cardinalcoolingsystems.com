import "server-only"
import { headers } from "next/headers"
import { sdk } from "@lib/config"

/*
  Bot protection, storefront half (see backend utils/abuse-policy.ts).

  Signup and login run as server actions, so the backend sees THIS
  server's address for every buyer. We forward the buyer's real address
  in x-client-ip, and prove the request is ours with
  x-storefront-secret (STOREFRONT_SHARED_SECRET, same value on the
  backend). The secret is server-only: never NEXT_PUBLIC_.

  The storefront is behind Cloudflare, so cf-connecting-ip is the buyer.
*/
export function clientIp(): string | undefined {
  const h = headers()
  const pick = (name: string) => h.get(name)?.split(",")[0]?.trim() || undefined
  return pick("cf-connecting-ip") ?? pick("x-real-ip") ?? pick("x-forwarded-for")
}

export function trustHeaders(turnstileToken?: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  const secret = process.env.STOREFRONT_SHARED_SECRET
  if (secret) out["x-storefront-secret"] = secret
  const ip = clientIp()
  if (ip) out["x-client-ip"] = ip
  if (turnstileToken) out["x-turnstile-token"] = turnstileToken
  return out
}

/* Turnstile drops its token into the form under this name. */
export const turnstileTokenFrom = (formData: FormData): string | null =>
  (formData.get("cf-turnstile-response") as string | null) || null

type TokenResponse = { token?: string; location?: string }

const tokenOf = (res: TokenResponse): string => {
  const token = res.token ?? res.location
  if (!token) throw new Error("No token returned")
  return token
}

/*
  sdk.auth.register / login take no headers, so go through the client.
  Same endpoints, same payloads.
*/
export async function authRegister(
  email: string,
  password: string,
  turnstileToken: string | null
): Promise<string> {
  const res = await sdk.client.fetch<TokenResponse>("/auth/customer/emailpass/register", {
    method: "POST",
    headers: trustHeaders(turnstileToken),
    body: { email, password },
  })
  return tokenOf(res)
}

export async function authLogin(email: string, password: string): Promise<string> {
  const res = await sdk.client.fetch<TokenResponse>("/auth/customer/emailpass", {
    method: "POST",
    headers: trustHeaders(),
    body: { email, password },
  })
  return tokenOf(res)
}

/* Backend guard errors, in words a buyer can act on. */
export function friendlyGuardError(error: any): string | null {
  const status = error?.status ?? error?.response?.status
  if (status === 429) {
    return "Too many attempts from your network. Please wait a while and try again, or email info@cardinalcoolingsystems.com."
  }
  if (status === 403 && /verify your browser|challenge/i.test(String(error?.message ?? ""))) {
    return "We could not verify your browser. Please reload the page and try again, or email info@cardinalcoolingsystems.com."
  }
  return null
}
