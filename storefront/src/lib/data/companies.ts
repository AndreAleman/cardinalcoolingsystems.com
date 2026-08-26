"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
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
}

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
      next: { tags: ["company"] },
    })
    .catch((err) => {
      if (err?.status === 404) {
        return null
      }
      return medusaError(err)
    })
})
