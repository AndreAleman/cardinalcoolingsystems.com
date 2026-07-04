import crypto from "node:crypto"
import { defineMiddlewares, validateAndTransformQuery } from "@medusajs/framework/http"
import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
} from "@medusajs/framework"
import { z } from "zod"
import { InventorySync } from "./webhooks/inventory-sync/validators"
import { ContactFormSchema } from "./store/contact/validators"
import { CreateOrderDocumentsSchema } from "./admin/order-documents/validators"

// Constant-time compare so the token check doesn't leak length/contents.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

// Shared-secret gate for the inventory sync webhook. The QuickBooks Desktop VM
// posts the same payload it sends Sanitube, with `Authorization: Bearer <token>`
// compared against CARDINAL_INVENTORY_SYNC_TOKEN. This route is outside /admin
// and /store, so this check is the only gate and must run before the validator.
function authenticateInventorySync(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const expected = process.env.CARDINAL_INVENTORY_SYNC_TOKEN
  if (!expected) {
    res.status(503).json({ ok: false, message: "Inventory sync is not configured." })
    return
  }
  const header = req.headers.authorization || ""
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : ""
  if (!token || !safeEqual(token, expected)) {
    res.status(401).json({ ok: false, message: "Unauthorized." })
    return
  }
  next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/product-feed",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(z.object({
          currency_code: z.string(),
          country_code: z.string(),
        }), {}),
      ],
    },
    {
      matcher: "/webhooks/inventory-sync",
      methods: ["POST"],
      middlewares: [authenticateInventorySync, validateAndTransformBody(InventorySync)],
    },
    {
      // Public contact / RFQ / bulk-pricing endpoint. Route-folder middleware.ts
      // files are NOT auto-loaded by Medusa v2, so the validator must be wired
      // here — otherwise req.validatedBody is always undefined and the endpoint
      // accepts arbitrary unvalidated input.
      matcher: "/store/contact",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(ContactFormSchema)],
    },
    {
      // Authenticated admin tool: one payload → packing slip + PO PDFs + Stripe
      // invoice. /admin/* is already auth-gated; this just validates the body.
      matcher: "/admin/order-documents",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(CreateOrderDocumentsSchema)],
    },
  ],
})
