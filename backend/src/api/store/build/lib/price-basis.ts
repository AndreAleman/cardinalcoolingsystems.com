// Price basis of a resolve (plan B2): a signed-in Team Member whose Company is Approved sees
// the Company price list (its Customer Group); everyone else sees list price.

import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { resolveCompanyContext } from "../../../../utils/company-context"
import type { PriceBasis } from "./resolver"

export type Buyer = {
  price_basis: PriceBasis
  customer_id: string | null
  company_id: string | null
  customer_group_id: string | null
  email_domain: string | null
}

export const ANONYMOUS_BUYER: Buyer = {
  price_basis: "list",
  customer_id: null,
  company_id: null,
  customer_group_id: null,
  email_domain: null,
}

/** Pure: company basis only for an Approved Company that has a Customer Group. */
export function decidePriceBasis(company: { status?: string | null; customer_group_id?: string | null } | null): {
  price_basis: PriceBasis
  customer_group_id: string | null
} {
  if (company && company.status === "approved" && company.customer_group_id) {
    return { price_basis: "company", customer_group_id: company.customer_group_id }
  }
  return { price_basis: "list", customer_group_id: null }
}

export function emailDomain(email: string | null | undefined): string | null {
  if (!email) return null
  const at = email.lastIndexOf("@")
  if (at < 0 || at === email.length - 1) return null
  return email.slice(at + 1).trim().toLowerCase() || null
}

export async function resolveBuyer(container: MedusaContainer, customerId: string | null | undefined): Promise<Buyer> {
  if (!customerId) return ANONYMOUS_BUYER
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const {
    data: [customer],
  } = await query.graph({ entity: "customer", fields: ["id", "email"], filters: { id: customerId } })
  if (!customer) return ANONYMOUS_BUYER

  const context = await resolveCompanyContext(container, customerId)
  let company: { status?: string | null; customer_group_id?: string | null } | null = null
  if (context) {
    const {
      data: [row],
    } = await query.graph({
      entity: "company",
      fields: ["id", "status", "customer_group.id"],
      filters: { id: context.companyId },
    })
    company = row ? { status: (row as any).status, customer_group_id: (row as any).customer_group?.id ?? null } : null
  }
  const decided = decidePriceBasis(company)
  return {
    ...decided,
    customer_id: customerId,
    company_id: context?.companyId ?? null,
    email_domain: emailDomain((customer as any).email),
  }
}
