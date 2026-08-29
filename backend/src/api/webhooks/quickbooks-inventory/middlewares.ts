import crypto from "node:crypto"
import {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { QbInventorySync } from "./validators"

// Constant-time compare so the token check doesn't leak length/contents.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ab.length !== bb.length) return false
  return crypto.timingSafeEqual(ab, bb)
}

// Shared-secret gate for the QuickBooks → Medusa inventory webhook.
// The QB Desktop VM sends `Authorization: Bearer <token>`; the token is
// compared against QB_INVENTORY_SYNC_TOKEN. This route lives outside /admin
// and /store, so Medusa applies no default auth — this check is the ONLY
// gate and must run before the body validator.
function authenticateQbWebhook(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction,
) {
  const expected = process.env.QB_INVENTORY_SYNC_TOKEN
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

export const webhookMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/webhooks/quickbooks-inventory",
    methods: ["POST"],
    middlewares: [authenticateQbWebhook, validateAndTransformBody(QbInventorySync)],
  },
]
