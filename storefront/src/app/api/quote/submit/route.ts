import { NextRequest, NextResponse } from "next/server"

// ── Draft order helpers ──────────────────────────────────────────────────────

// In-memory token cache — avoids a login round-trip on every quote submit
let cachedToken: { token: string; expiresAt: number } | null = null

async function getMedusaAdminToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"
    const email = process.env.MEDUSA_ADMIN_EMAIL ?? "admin@yourmail.com"
    const password = process.env.MEDUSA_ADMIN_PASSWORD ?? ""
    const res = await fetch(`${backendUrl}/auth/user/emailpass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    const token: string = data.token
    if (!token) return null
    // Cache for 23 hours (tokens typically last 24h)
    cachedToken = { token, expiresAt: Date.now() + 23 * 60 * 60 * 1000 }
    return token
  } catch {
    return null
  }
}

async function getMedusaRegionId(): Promise<string | null> {
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"
    const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""
    const res = await fetch(`${backendUrl}/store/regions`, {
      headers: {
        "x-publishable-api-key": publishableKey,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })
    if (!res.ok) return null
    const data = await res.json()
    // Prefer US region, fall back to first available
    const regions: Array<{ id: string; countries?: Array<{ iso_2: string }> }> =
      data.regions ?? []
    const us = regions.find((r) =>
      r.countries?.some((c) => c.iso_2 === "us")
    )
    return (us ?? regions[0])?.id ?? null
  } catch {
    return null
  }
}

async function createMedusaDraftOrder(
  data: QuoteSubmitPayload,
  regionId: string
): Promise<{ id: string } | null> {
  try {
    const backendUrl = process.env.MEDUSA_BACKEND_URL ?? "http://localhost:9000"
    const token = await getMedusaAdminToken()
    if (!token) {
      console.warn("[Quote] Could not obtain Medusa admin token")
      return null
    }

    const nameParts = data.name.trim().split(" ")
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || firstName

    const body = {
      region_id: regionId,
      email: data.email,
      items: data.items.map((item) => ({
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: 0,
      })),
      shipping_address: {
        first_name: firstName,
        last_name: lastName,
        address_1: "Pending — Quote Request",
        city: "TBD",
        country_code: "us",
        postal_code: "00000",
        phone: data.phone ?? "",
        company: data.company ?? "",
      },
      metadata: {
        source: "quote_request",
        company: data.company ?? "",
        phone: data.phone ?? "",
        timeline: data.timeline ?? "",
        notes: data.notes ?? "",
        submitted_at: new Date().toISOString(),
      },
    }

    const res = await fetch(`${backendUrl}/admin/draft-orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("[Quote] Draft order creation failed:", err)
      return null
    }

    const result = await res.json()
    return result.draft_order ?? null
  } catch (err) {
    console.error("[Quote] Draft order error:", err)
    return null
  }
}

export type QuoteItemPayload = {
  productId: string
  productTitle: string
  productHandle: string
  productThumbnail?: string
  variantId: string
  variantTitle?: string
  variantSku?: string
  variantOptions?: Array<{ title: string; value: string }>
  quantity: number
}

export type QuoteSubmitPayload = {
  name: string
  email: string
  phone?: string
  company?: string
  timeline?: string
  notes?: string
  items: QuoteItemPayload[]
}

function buildAdminEmailHtml(data: QuoteSubmitPayload): string {
  const itemRows = data.items
    .map((item) => {
      const options = item.variantOptions?.map((o) => `${o.title}: ${o.value}`).join(", ") ?? ""
      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111;">
            ${item.productTitle}${options ? `<br><span style="color:#6b7280;font-size:12px;">${options}</span>` : ""}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#E3000F;font-family:monospace;">
            ${item.variantSku ?? "—"}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111;text-align:center;">
            ${item.quantity}
          </td>
        </tr>`
    })
    .join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

        <!-- Header -->
        <tr>
          <td style="background:#E3000F;padding:24px 32px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">New Quote Request</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
              Submitted ${new Date().toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </td>
        </tr>

        <!-- Contact info -->
        <tr>
          <td style="padding:28px 32px 0;">
            <h2 style="margin:0 0 16px;font-size:15px;font-weight:600;color:#111;text-transform:uppercase;letter-spacing:0.05em;">Contact Information</h2>
            <table cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding:6px 0;width:130px;font-size:13px;color:#6b7280;font-weight:500;">Name</td>
                <td style="padding:6px 0;font-size:14px;color:#111;">${data.name}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:500;">Email</td>
                <td style="padding:6px 0;font-size:14px;color:#111;"><a href="mailto:${data.email}" style="color:#E3000F;">${data.email}</a></td>
              </tr>
              ${data.phone ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:500;">Phone</td><td style="padding:6px 0;font-size:14px;color:#111;">${data.phone}</td></tr>` : ""}
              ${data.company ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:500;">Company</td><td style="padding:6px 0;font-size:14px;color:#111;">${data.company}</td></tr>` : ""}
              ${data.timeline ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7280;font-weight:500;">Timeline</td><td style="padding:6px 0;font-size:14px;color:#111;">${data.timeline}</td></tr>` : ""}
            </table>
          </td>
        </tr>

        <!-- Items -->
        <tr>
          <td style="padding:28px 32px 0;">
            <h2 style="margin:0 0 16px;font-size:15px;font-weight:600;color:#111;text-transform:uppercase;letter-spacing:0.05em;">Quoted Items</h2>
            <table cellpadding="0" cellspacing="0" width="100%" style="border:1px solid #f3f4f6;border-radius:6px;overflow:hidden;">
              <thead>
                <tr style="background:#f9fafb;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Product</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">SKU</th>
                  <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Qty</th>
                </tr>
              </thead>
              <tbody>${itemRows}</tbody>
            </table>
          </td>
        </tr>

        ${data.notes ? `
        <!-- Notes -->
        <tr>
          <td style="padding:28px 32px 0;">
            <h2 style="margin:0 0 12px;font-size:15px;font-weight:600;color:#111;text-transform:uppercase;letter-spacing:0.05em;">Notes</h2>
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;background:#f9fafb;border-radius:6px;padding:14px 16px;">${data.notes.replace(/\n/g, "<br>")}</p>
          </td>
        </tr>` : ""}

        <!-- Footer -->
        <tr>
          <td style="padding:28px 32px 32px;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Reply directly to this email to respond to ${data.name}.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function buildCustomerEmailHtml(data: QuoteSubmitPayload): string {
  const itemList = data.items
    .map((item) => {
      const options = item.variantOptions?.map((o) => o.value).join(" · ") ?? ""
      return `<li style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#374151;">
        <strong style="color:#111;">${item.productTitle}</strong>${options ? ` — ${options}` : ""}
        ${item.variantSku ? `<br><span style="font-family:monospace;font-size:12px;color:#E3000F;">SKU: ${item.variantSku}</span>` : ""}
        <span style="float:right;color:#6b7280;">Qty: ${item.quantity}</span>
      </li>`
    })
    .join("")

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'IBM Plex Sans',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr>
          <td style="background:#E3000F;padding:24px 32px;">
            <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">We received your quote request</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Cardinal Cooling Systems</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.6;">
              Hi ${data.name}, thank you for your quote request. Our team will review it and get back to you within 1 business day.
            </p>
            <h2 style="margin:0 0 14px;font-size:15px;font-weight:600;color:#111;text-transform:uppercase;letter-spacing:0.05em;">Your Requested Items</h2>
            <ul style="margin:0;padding:0;list-style:none;border:1px solid #f3f4f6;border-radius:6px;padding:0 16px;">
              ${itemList}
            </ul>
            ${data.timeline ? `<p style="margin:20px 0 0;font-size:14px;color:#6b7280;">Timeline: <strong style="color:#111;">${data.timeline}</strong></p>` : ""}
            <p style="margin:24px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
              Questions? Reply to this email or call us directly.<br>
              <strong style="color:#111;">Cardinal Cooling Systems</strong>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

async function sendEmail(to: string, subject: string, html: string, replyTo?: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL ?? "contact@cardinalcoolingsystems.com"

  if (!apiKey) throw new Error("RESEND_API_KEY is not set")

  const body: Record<string, unknown> = { from, to, subject, html }
  if (replyTo) body.reply_to = replyTo

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }

  return res.json()
}

export async function POST(req: NextRequest) {
  try {
    const data: QuoteSubmitPayload = await req.json()

    if (!data.name || !data.email || !data.items?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adminEmail = process.env.QUOTE_ADMIN_EMAIL ?? "aleman@cardinalcoolingsystems.com"

    // Send both emails + attempt draft order creation concurrently.
    // Draft order is best-effort — its failure doesn't block the response.
    const [, , draftOrder] = await Promise.all([
      // Admin notification
      sendEmail(
        adminEmail,
        `New Quote Request from ${data.name}${data.company ? ` (${data.company})` : ""}`,
        buildAdminEmailHtml(data),
        data.email
      ),
      // Customer confirmation
      sendEmail(
        data.email,
        "Your quote request — Cardinal Cooling Systems",
        buildCustomerEmailHtml(data)
      ),
      // Draft order in Medusa
      getMedusaRegionId().then((regionId) =>
        regionId ? createMedusaDraftOrder(data, regionId) : null
      ),
    ])

    const draftOrderId = (draftOrder as { id?: string } | null)?.id ?? null
    if (draftOrderId) {
      console.log(`[Quote] Draft order created: ${draftOrderId}`)
    } else {
      console.warn("[Quote] Draft order was not created (non-fatal)")
    }

    return NextResponse.json({ success: true, draftOrderId })
  } catch (error) {
    console.error("Quote submit error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit quote" },
      { status: 500 }
    )
  }
}
