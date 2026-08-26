"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { revalidateTag } from "next/cache"
import { cache } from "react"
import { getAuthHeaders } from "./cookies"

export type Company = {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
  logo_url: string | null
  currency_code: string | null
  status: CompanyStatus
  welcome_code: string | null
}

export type CompanyStatus = "pending" | "approved" | "declined"

export type TeamMemberRole = "member" | "manager" | "admin"

export type CompanyMembership = {
  company: Company
  role: TeamMemberRole
}

/*
  The signed-in Team Member's Company. Resolved server-side from the
  auth token only (ADR-0004). Null when not signed in or when the
  customer is not a Team Member of any Company (a retail customer).
  Any other failure (backend down) is surfaced, not hidden as "retail".
*/
export const getCompany = cache(async function (): Promise<CompanyMembership | null> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) {
    return null
  }
  return sdk.client
    .fetch<CompanyMembership>("/store/companies/me", {
      method: "GET",
      headers,
      // Per-person data, and approval must show on the very next load:
      // never let Next's fetch cache hold it.
      cache: "no-store",
    })
    .catch((err) => {
      if (err?.status === 404) {
        return null
      }
      return medusaError(err)
    })
})

export type CompanySignupResult = CompanyMembership & { welcome_code: string }

/*
  Create the signed-in customer's Company (Pending until Cardinal
  approves it). Returns the Welcome Code so it can be shown at once.
*/
export async function createCompany(name: string): Promise<CompanySignupResult> {
  const result = await sdk.client
    .fetch<CompanySignupResult>("/store/companies", {
      method: "POST",
      headers: getAuthHeaders(),
      body: { name },
    })
    .catch(medusaError)
  revalidateTag("company")
  return result
}

export type TeamMember = {
  id: string
  role: TeamMemberRole
  customer: { id: string; email: string; first_name: string | null; last_name: string | null } | null
}
export type OpenInvite = { id: string; email: string; expires_at: string }

export const getTeam = cache(async function (): Promise<{ team: TeamMember[]; invites: OpenInvite[] } | null> {
  const headers = getAuthHeaders()
  if (!("authorization" in headers)) return null
  return sdk.client
    .fetch<{ team: TeamMember[]; invites: OpenInvite[] }>("/store/dashboard/team", {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .catch(() => null)
})

/* Form action: invite a coworker by email. Returns an error string or null. */
export async function inviteTeamMember(_state: unknown, formData: FormData): Promise<string | null> {
  const email = ((formData.get("email") as string) || "").trim()
  try {
    await sdk.client.fetch("/store/dashboard/invites", {
      method: "POST",
      headers: getAuthHeaders(),
      body: { email },
    })
    revalidateTag("company")
    return null
  } catch (error: any) {
    return error?.message ?? "Could not send the invite"
  }
}

export type InvitePreview = { email: string; company_name: string; expires_at: string }

export async function getInvite(token: string): Promise<InvitePreview | null> {
  return sdk.client
    .fetch<{ invite: InvitePreview }>(`/store/companies/invites/${encodeURIComponent(token)}`, {
      method: "GET",
      cache: "no-store",
    })
    .then(({ invite }) => invite)
    .catch(() => null)
}

export async function acceptInvite(token: string): Promise<CompanyMembership> {
  const result = await sdk.client
    .fetch<CompanyMembership>(`/store/companies/invites/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      headers: getAuthHeaders(),
    })
    .catch(medusaError)
  revalidateTag("company")
  return result
}
