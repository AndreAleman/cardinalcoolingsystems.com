"use server"

/*
  Server actions for the Dashboard's Quick Order (CONTEXT.md).

  Search goes through the standard /store/products endpoint with
  region_id + the auth bearer so calculated_price honors the Company's
  Price List. Submissions build a REAL Medusa cart per path and hand its
  id to the custom /store/order-form/* routes — the backend re-verifies
  every money rule server-side.

  Ported/adapted from accurateforklift.net's order-form data layer, with
  Cardinal differences: no ad-hoc SKUs, prices/stock ARE shown, and a
  mixed cart splits into a pay cart plus a quote cart (two submissions).
*/

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, setCartId } from "./cookies"
import { getRegion } from "./regions"

const PRODUCT_FIELDS = [
  "id",
  "title",
  "handle",
  "thumbnail",
  "metadata",
  "*variants",
  "+variants.metadata",
  "+variants.inventory_quantity",
  "+variants.manage_inventory",
  "+variants.allow_backorder",
  "+variants.weight",
  "*variants.calculated_price",
].join(",")

/*
  Search parts by free text (SKU fragment, title). Empty q returns the
  first `limit` products so the Quick Order table isn't empty on load.
*/
export async function searchPortalProducts({
  q,
  countryCode,
  limit = 100,
}: {
  q?: string
  countryCode: string
  limit?: number
}): Promise<HttpTypes.StoreProduct[]> {
  const headers = getAuthHeaders()
  const region = await getRegion(countryCode)

  const query: Record<string, any> = {
    limit,
    offset: 0,
    fields: PRODUCT_FIELDS,
  }
  if (q) query.q = q
  if (region?.id) query.region_id = region.id

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>("/store/products", {
      method: "GET",
      query,
      headers,
      cache: "no-store",
    })
    .then(({ products }) => products ?? [])
    .catch(medusaError)
}

/*
  Fetch products for a set of variant ids (Order Again / Favorites rows
  need live price + stock for parts that may be outside the current
  search window).
*/
export async function getPortalProductsByVariantIds(
  variantIds: string[],
  countryCode: string
): Promise<HttpTypes.StoreProduct[]> {
  if (!variantIds.length) return []
  const headers = getAuthHeaders()
  const region = await getRegion(countryCode)

  const query: Record<string, any> = {
    limit: Math.max(variantIds.length, 50),
    fields: PRODUCT_FIELDS,
    variants: { id: variantIds },
  }
  if (region?.id) query.region_id = region.id

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[] }>("/store/products", {
      method: "GET",
      query,
      headers,
      cache: "no-store",
    })
    .then(({ products }) => products ?? [])
    .catch(() => [])
}

export type SubmitLine = {
  variant_id: string
  quantity: number
}

export type CartAddressPayload = {
  first_name?: string
  last_name?: string
  company?: string
  address_1: string
  address_2?: string
  city: string
  postal_code: string
  province?: string
  country_code: string
  phone?: string
  metadata?: Record<string, unknown>
}

type BuildCartExtras = {
  billing_address?: CartAddressPayload | null
  shipping_address?: CartAddressPayload | null
}

/*
  Build a fresh Medusa cart holding exactly `lines` — the unit each
  order-form submission route consumes. NOT the storefront's cookie cart
  (a mixed Quick Order submission needs two carts at once).

  `forQuote` routes cart creation through the dedicated
  /store/order-form/quote-cart backend route: the standard cart API
  rejects exactly the lines a Quote Request carries (no price on file,
  quantity over stock), while quote-cart accepts them — and priced
  lines too, so a quote_all cart (whole order quote-bound) also goes
  through it.
*/
async function buildPortalCart(
  lines: SubmitLine[],
  countryCode: string,
  extras?: BuildCartExtras,
  forQuote?: boolean
): Promise<{ id: string }> {
  if (!lines.length) {
    throw new Error("No items to submit.")
  }
  const headers = getAuthHeaders()
  const region = await getRegion(countryCode)
  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart: { id: string }
  if (forQuote) {
    const { cart_id } = await sdk.client
      .fetch<{ cart_id: string }>("/store/order-form/quote-cart", {
        method: "POST",
        headers,
        body: {
          region_id: region.id,
          items: lines.map((l) => ({
            variant_id: l.variant_id,
            quantity: l.quantity,
          })),
        },
      })
      .catch(medusaError)
    cart = { id: cart_id }
  } else {
    const created = await sdk.store.cart
      .create(
        {
          region_id: region.id,
          items: lines.map((l) => ({
            variant_id: l.variant_id,
            quantity: l.quantity,
          })),
        },
        {},
        headers
      )
      .catch(medusaError)
    cart = created.cart
  }

  if (extras?.billing_address || extras?.shipping_address) {
    await sdk.store.cart
      .update(
        cart.id,
        {
          ...(extras.billing_address
            ? { billing_address: extras.billing_address as any }
            : {}),
          ...(extras.shipping_address
            ? { shipping_address: extras.shipping_address as any }
            : {}),
        },
        {},
        headers
      )
      .catch(medusaError)
  }

  return cart
}

export type SubmitExtras = {
  po_number?: string
  attn_to?: string
  notes?: string
} & BuildCartExtras

export type QuoteSubmitResult = {
  quote_id: string | null
  approval_id: string | null
  pending_approval: boolean
}

export type OrderSubmitResult = QuoteSubmitResult & {
  order_id: string | null
}

/* Quote Request: build a cart from `lines`, submit it for pricing. */
export async function submitPortalQuoteRequest(
  lines: SubmitLine[],
  countryCode: string,
  extras?: SubmitExtras
): Promise<QuoteSubmitResult> {
  const cart = await buildPortalCart(lines, countryCode, extras, true)
  const result = await sdk.client
    .fetch<QuoteSubmitResult>("/store/order-form/request-quote", {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        cart_id: cart.id,
        po_number: extras?.po_number || undefined,
        attn_to: extras?.attn_to || undefined,
        notes: extras?.notes || undefined,
      },
    })
    .catch(medusaError)
  revalidateTag("quotes")
  return result
}

/* Invoice order: invoice-enabled Companies only; PO required. */
export async function submitPortalInvoiceOrder(
  lines: SubmitLine[],
  countryCode: string,
  extras: SubmitExtras & { po_number: string }
): Promise<OrderSubmitResult> {
  const cart = await buildPortalCart(lines, countryCode, extras)
  const result = await sdk.client
    .fetch<OrderSubmitResult>("/store/order-form/place-invoice-order", {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        cart_id: cart.id,
        po_number: extras.po_number,
        attn_to: extras.attn_to || undefined,
        notes: extras.notes || undefined,
      },
    })
    .catch(medusaError)
  revalidateTag("quotes")
  revalidateTag("orders")
  return result
}

/* Deposit order: heavy $7,500+ orders taken unpaid, 50% deposit due. */
export async function submitPortalDepositOrder(
  lines: SubmitLine[],
  countryCode: string,
  extras: SubmitExtras & { po_number: string }
): Promise<OrderSubmitResult> {
  const cart = await buildPortalCart(lines, countryCode, extras)
  const result = await sdk.client
    .fetch<OrderSubmitResult>("/store/order-form/place-deposit-order", {
      method: "POST",
      headers: getAuthHeaders(),
      body: {
        cart_id: cart.id,
        po_number: extras.po_number,
        attn_to: extras.attn_to || undefined,
        notes: extras.notes || undefined,
      },
    })
    .catch(medusaError)
  revalidateTag("quotes")
  revalidateTag("orders")
  return result
}

/*
  Review & Pay: build a cart from the payable lines and make it the
  storefront's cookie cart so the standard /:countryCode/checkout flow
  picks it up. Returns the cart id; the caller redirects client-side.
*/
export async function preparePortalCheckoutCart(
  lines: SubmitLine[],
  countryCode: string
): Promise<{ cart_id: string }> {
  const cart = await buildPortalCart(lines, countryCode)
  setCartId(cart.id)
  revalidateTag("cart")
  return { cart_id: cart.id }
}
