"use server"

/*
  Cardinal Builder data (docs/specs/cardinal-builder-plan.md, "Backend contracts").

  Server actions, so the buyer's httpOnly auth cookie reaches the backend (B2: an Approved
  Company sees its price list) and the cart cookie works the way lib/data/cart.ts does.
  Plain fetch instead of sdk.client.fetch: the panels need the response status and body
  `code`. Results are returned, never thrown (Next strips server-action errors in production).

  - resolveBuild         POST /store/build/resolve      { builder_type, options }
  - addBuildToQuoteList  POST /store/build/quote-lines  { cart_id?, builder_type, options, source_page }
  - requestCadFiles      POST /store/cad-requests       { builder_type, options, name, company, email, … }
  - getCadDownload       GET  /store/cad-downloads/:token
*/

import { getBuilder, isBuilderType, type Options } from "@lib/cpq/shared"
import { mapCadRequestResponse, isPlausibleCadToken, sortCadFiles, validateCadContact, CAD_MESSAGES } from "@lib/builder/cad"
import type {
  ActionResult,
  CadDownloadDTO,
  CadRequestInput,
  CadRequestResult,
  QuoteLinesResponse,
  ResolveResponse,
} from "@lib/builder/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCartId, setCartId } from "./cookies"
import { getOrSetCart } from "./cart"
import { trustHeaders } from "./storefront-trust"

const BACKEND_URL = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

const RESOLVE_TIMEOUT_MS = 15_000
const QUOTE_LINES_TIMEOUT_MS = 30_000
// Logged-in CAD generation may run synchronously (Sanitube: 45 s backend timeout); leave headroom.
const CAD_TIMEOUT_MS = 60_000
const CAD_DOWNLOAD_TIMEOUT_MS = 15_000

function baseHeaders(): Record<string, string> {
  return { accept: "application/json", "x-publishable-api-key": PUBLISHABLE_KEY }
}

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json()
  } catch {
    return null
  }
}

function messageOf(body: unknown, fallback: string): string {
  const m = body && typeof body === "object" ? (body as { message?: unknown }).message : undefined
  return typeof m === "string" && m.trim() ? m : fallback
}

/** Canonical options for a builder type (forgiving decode), or null for an unknown type. */
function canonical(builderType: string, options: Options): Options | null {
  if (!isBuilderType(builderType)) return null
  return getBuilder(builderType).decode(options).options
}

/** Live resolve of a configuration: BOM, Pricing Mode, price, lead time, Part Number. */
export async function resolveBuild(builderType: string, options: Options): Promise<ActionResult<ResolveResponse>> {
  const opts = canonical(builderType, options)
  if (!opts) return { ok: false, message: "Unknown builder." }
  try {
    const res = await fetch(`${BACKEND_URL}/store/build/resolve`, {
      method: "POST",
      headers: { ...baseHeaders(), ...getAuthHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ builder_type: builderType, options: opts }),
      cache: "no-store",
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    })
    const body = await readJson(res)
    if (!res.ok || !body || typeof body !== "object") {
      return { ok: false, status: res.status, message: messageOf(body, "Couldn't check prices.") }
    }
    return { ok: true, data: body as ResolveResponse }
  } catch (err) {
    console.error("resolveBuild failed:", (err as Error)?.message ?? "unknown")
    return { ok: false, message: "Couldn't check prices." }
  }
}

/**
 * Adds a configuration to the Quote List (the Medusa cart, B3). Instant: the BOM variants;
 * Quote: one custom line with server-built metadata. Reuses the cart cookie; with none, creates
 * the cart in this country's region (getOrSetCart) so it matches the rest of the store.
 */
export async function addBuildToQuoteList(input: {
  builderType: string
  options: Options
  countryCode: string
  sourcePage?: string | null
}): Promise<ActionResult<QuoteLinesResponse>> {
  const opts = canonical(input.builderType, input.options)
  if (!opts) return { ok: false, message: "Unknown builder." }

  let cartId = getCartId()
  if (!cartId) {
    try {
      cartId = (await getOrSetCart(input.countryCode)).id
    } catch {
      cartId = undefined // the route creates one in the default region
    }
  }

  try {
    const res = await fetch(`${BACKEND_URL}/store/build/quote-lines`, {
      method: "POST",
      headers: { ...baseHeaders(), ...getAuthHeaders(), "content-type": "application/json" },
      body: JSON.stringify({
        cart_id: cartId || undefined,
        builder_type: input.builderType,
        options: opts,
        source_page: (input.sourcePage || "").slice(0, 500) || undefined,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(QUOTE_LINES_TIMEOUT_MS),
    })
    const body = (await readJson(res)) as QuoteLinesResponse | null
    if (!res.ok || !body?.cart_id) {
      return { ok: false, status: res.status, message: messageOf(body, "Couldn't add this configuration. Please try again.") }
    }
    if (body.cart_id !== cartId) setCartId(body.cart_id)
    revalidateTag("cart")
    return { ok: true, data: body }
  } catch (err) {
    console.error("addBuildToQuoteList failed:", (err as Error)?.message ?? "unknown")
    return { ok: false, message: "Couldn't add this configuration. Please try again." }
  }
}

/**
 * CAD request behind the work-email gate (B7/B8). The bot-guard fields ride in the body, as on
 * the contact form, and the buyer's address + Turnstile token in the trust headers. The bot
 * guard's honeypot (`website`) is also sent as the contract's `company_website`.
 */
export async function requestCadFiles(input: CadRequestInput): Promise<CadRequestResult> {
  const opts = canonical(input?.builder_type, input?.options ?? {})
  if (!opts) return { ok: false, code: "invalid", message: "This configuration isn't valid." }

  const contact = validateCadContact({ name: input.name, company: input.company, email: input.email })
  if (!contact.ok) return { ok: false, code: "invalid", message: contact.message }

  try {
    const res = await fetch(`${BACKEND_URL}/store/cad-requests`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        ...getAuthHeaders(),
        ...trustHeaders(input.turnstile_token),
        "content-type": "application/json",
      },
      body: JSON.stringify({
        builder_type: input.builder_type,
        options: opts,
        name: contact.value.name,
        company: contact.value.company,
        email: contact.value.email,
        company_website: input.website ?? "",
        website: input.website ?? "",
        elapsed_ms: input.elapsed_ms,
        turnstile_token: input.turnstile_token,
        source_page: (input.source_page || "").slice(0, 500) || undefined,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(CAD_TIMEOUT_MS),
    })
    return mapCadRequestResponse(res.status, await readJson(res), contact.value.email)
  } catch (err) {
    console.error("requestCadFiles failed:", (err as Error)?.message ?? "unknown")
    return { ok: false, code: "invalid", message: CAD_MESSAGES.generic }
  }
}

/** Landing-page data for an emailed CAD link: null for an unknown token; throws when unreachable. */
export async function getCadDownload(token: string): Promise<CadDownloadDTO | null> {
  if (!isPlausibleCadToken(token)) return null
  const res = await fetch(`${BACKEND_URL}/store/cad-downloads/${encodeURIComponent(token)}`, {
    method: "GET",
    headers: { ...baseHeaders(), ...trustHeaders() },
    cache: "no-store",
    signal: AbortSignal.timeout(CAD_DOWNLOAD_TIMEOUT_MS),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`cad-downloads ${res.status}`)
  const json = (await readJson(res)) as { cad_download?: CadDownloadDTO } | null
  const dto = json?.cad_download
  if (!dto) throw new Error("cad-downloads: empty body")
  return {
    ...dto,
    configuration_display: Array.isArray(dto.configuration_display) ? dto.configuration_display : [],
    files: sortCadFiles(dto.files),
  }
}
