"use client"

import { useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { identifyUser } from "@lib/util/posthog"

/**
 * Identifies the logged-in customer in PostHog. Rendered from the account
 * layout, so it runs on every account page load after login — robust without
 * having to intercept the `login` server action's redirect.
 */
export default function PostHogIdentify({
  customer,
}: {
  customer: HttpTypes.StoreCustomer
}) {
  useEffect(() => {
    identifyUser(customer.id, {
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      phone: customer.phone,
      company_name: customer.company_name,
    })
  }, [customer])

  return null
}
