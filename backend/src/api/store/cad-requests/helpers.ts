import type { MedusaRequest } from "@medusajs/framework/http"
import { isFromStorefront, requestIp } from "../../middlewares/abuse-guard"
import type { CadIpSource } from "../../../modules/cad-request/types"

/*
  Who is asking, for the CAD per-IP allowance (5 counted requests per 24 h). Cardinal's backend sits
  on Railway's edge, and CAD Requests arrive through the storefront server, whose own address is
  shared by every buyer. Only the buyer address the storefront forwards in x-client-ip, on a
  request that proved itself with x-storefront-secret (ADR-0008), is "forwarded" (trusted). An
  x-real-ip / x-forwarded-for address is recorded as "xff" and the socket as "socket": neither
  counts toward the per-IP allowance, so a shared address never blocks real buyers.
*/
export function cadClientIp(req: MedusaRequest): { ip: string | null; source: CadIpSource } {
  const ip = requestIp(req)
  const header = (name: string) => {
    const v = req.headers[name]
    return (Array.isArray(v) ? v[0] : v)?.split(",")[0]?.trim() || undefined
  }
  if (isFromStorefront(req) && header("x-client-ip") === ip) return { ip, source: "forwarded" }
  if (header("x-real-ip") === ip || header("x-forwarded-for") === ip) return { ip, source: "xff" }
  return { ip: ip === "unknown" ? null : ip, source: "socket" }
}

/** What a honeypot hit sees: a plain success shaped like a real one (nothing is stored or sent). */
export function honeypotResponse(review: boolean, email: string | null) {
  return review
    ? { ok: true, outcome: "review", cad_request: { id: "cadr_0", display_id: 0 }, part_number: "", email }
    : { ok: true, outcome: "emailed", cad_request: { id: "cadr_0", display_id: 0 }, part_number: "" }
}
