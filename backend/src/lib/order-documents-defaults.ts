/**
 * Static defaults for the "Order Documents" tool.
 *
 * These prefill the admin form and act as a fallback so the most common vendor
 * (Sanitube) and your own company details aren't retyped on every order.
 */

export const DEFAULT_VENDOR = {
  name: "Sanitube",
  address: {
    line1: "180 Contractors Way,",
    line2: "",
    city: "Lakeland, FL",
    postal: "33801",
    country: "USA",
  },
}

export const INVOICE_TERMS = "Net 15"
export const INVOICE_DAYS_UNTIL_DUE = 15
export const INVOICE_CURRENCY = "usd"
