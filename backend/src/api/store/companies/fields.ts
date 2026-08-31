/* What the storefront may see of a Company. Never cost/margin data. */
export const COMPANY_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "zip",
  "country",
  "logo_url",
  "currency_code",
  "status",
  "welcome_code",
  // The Dashboard picks the "Place Order" path from this: ON = invoice
  // order, OFF = checkout / deposit / quote per the money rules.
  "invoice_payment_enabled",
];
