import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import Stripe from "stripe"
import type { CreateOrderDocumentsSchema } from "../../api/admin/order-documents/validators"
import {
  INVOICE_CURRENCY,
  INVOICE_DAYS_UNTIL_DUE,
} from "../../lib/order-documents-defaults"

type Input = CreateOrderDocumentsSchema

export type InvoiceResult = {
  id: string
  status: "draft"
  total: number
  currency: string
  dashboardUrl: string
}

function dashboardUrl(apiKey: string, id: string): string {
  const isTest = apiKey.startsWith("sk_test") || apiKey.startsWith("rk_test")
  return `https://dashboard.stripe.com/${isTest ? "test/" : ""}invoices/${id}`
}

function lineName(description: string, spec?: string, sku?: string): string {
  const base = spec ? `${description}, ${spec}` : description
  return sku ? `${base} (SKU: ${sku})` : base
}

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

/**
 * Creates a Stripe DRAFT invoice for the customer using the CLIENT prices (what
 * you charge), plus an optional shipping line. The invoice is left as a draft
 * for you to review and send from the Stripe dashboard — nothing is emailed to
 * the customer and no sales tax is applied. Set up with collection_method
 * "send_invoice" so hitting "Send" in Stripe later emails the hosted invoice.
 *
 * Compensation deletes the draft if a later workflow step fails.
 */
export const createStripeInvoiceStep = createStep(
  "create-stripe-invoice",
  async (input: Input) => {
    const apiKey = process.env.STRIPE_API_KEY
    if (!apiKey) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "STRIPE_API_KEY is not configured on the backend."
      )
    }
    const stripe = new Stripe(apiKey)
    const currency = INVOICE_CURRENCY

    // Reuse an existing Stripe customer by email, else create one.
    const existing = await stripe.customers.list({
      email: input.customer.email,
      limit: 1,
    })
    const customer =
      existing.data[0] ??
      (await stripe.customers.create({
        name: input.customer.name,
        email: input.customer.email,
        address: {
          line1: input.customer.address.line1,
          line2: input.customer.address.line2 || undefined,
          city: input.customer.address.city,
          state: input.customer.address.state || undefined,
          postal_code: input.customer.address.postal,
          country: "US",
        },
      }))

    const description = input.clientPoNumber
      ? `Order ${input.orderNumber} · Client PO ${input.clientPoNumber}`
      : `Order ${input.orderNumber}`

    // Create the draft invoice first, then attach line items to it explicitly.
    const invoice = await stripe.invoices.create({
      customer: customer.id,
      collection_method: "send_invoice",
      days_until_due: INVOICE_DAYS_UNTIL_DUE,
      auto_advance: false,
      currency,
      description,
      metadata: {
        order_number: input.orderNumber,
        client_po: input.clientPoNumber || "",
        source: "order_documents_tool",
      },
    })
    const invoiceId = invoice.id as string

    // Clean up the orphaned draft if attaching items fails (no compensation is
    // registered until we return a StepResponse).
    try {
      // Stripe invoice items in this API version take a line `amount` (total in
      // cents) + `description`; there's no top-level unit_amount, so we fold the
      // qty × unit-price breakdown into the description for clarity.
      for (const item of input.items) {
        const unitCents = Math.round(item.unitPrice * 100)
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoiceId,
          currency,
          amount: unitCents * item.quantity,
          description: `${lineName(item.description, item.spec, item.sku)} — ${item.quantity} × ${fmtUsd(unitCents)}`,
        })
      }

      if (input.shipping && input.shipping > 0) {
        await stripe.invoiceItems.create({
          customer: customer.id,
          invoice: invoiceId,
          currency,
          amount: Math.round(input.shipping * 100),
          description: "Shipping",
        })
      }

      // Re-retrieve so the total reflects the attached line items.
      const draft = await stripe.invoices.retrieve(invoiceId)
      const result: InvoiceResult = {
        id: invoiceId,
        status: "draft",
        total: draft.total,
        currency,
        dashboardUrl: dashboardUrl(apiKey, invoiceId),
      }
      return new StepResponse(result, { id: invoiceId })
    } catch (err) {
      try {
        await stripe.invoices.del(invoiceId)
      } catch {
        // best-effort cleanup
      }
      throw err
    }
  },
  // Compensation: a later step failed — delete the draft invoice.
  async (comp) => {
    if (!comp) return
    const apiKey = process.env.STRIPE_API_KEY
    if (!apiKey) return
    const stripe = new Stripe(apiKey)
    try {
      await stripe.invoices.del(comp.id)
    } catch {
      // best-effort
    }
  }
)
