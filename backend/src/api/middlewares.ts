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
  ],
})
