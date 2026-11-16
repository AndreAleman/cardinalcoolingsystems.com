import {
  authenticate,
  type MedusaNextFunction,
  type MedusaRequest,
  type MedusaResponse,
  type MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { honeypotTripped } from "../../../utils/abuse-policy"
import { rateLimit, requestIp, requireTurnstile } from "../../middlewares/abuse-guard"
import { CAD_REQUEST_MODULE } from "../../../modules/cad-request"
import { honeypotResponse } from "./helpers"
import { StoreCreateCadRequest } from "./validators"

const isCustomer = (req: MedusaRequest) => (req as any).auth_context?.actor_type === "customer"

/*
  Honeypot for CAD Requests (visitors only): the trap field `website` or a submit faster than
  MIN_FILL_MS gets a calm 201 shaped like a real answer ("review" while CAD Review is on), and
  nothing is stored or sent (ADR-0008: telling a bot it was caught only teaches it).
*/
export async function cadHoneypot(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (isCustomer(req) || !honeypotTripped(req.body)) return next()
  let review = true
  try {
    review = await req.scope.resolve<{ requireReview(): Promise<boolean> }>(CAD_REQUEST_MODULE).requireReview()
  } catch {
    review = true
  }
  try {
    req.scope.resolve<{ warn: (m: string) => void }>("logger").warn(`[abuse-guard] honeypot tripped by ${requestIp(req)} on ${req.path}`)
  } catch {
    // no logger
  }
  const email = String((req.body as any)?.email ?? "").trim().toLowerCase() || null
  res.status(201).json(honeypotResponse(review, email))
}

/* Turnstile for visitors; a signed-in customer already proved itself at login. Fails open (ADR-0008). */
export function cadTurnstile(req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
  if (isCustomer(req)) return next()
  return requireTurnstile(req, res, next)
}

/*
  /store/cad-requests is anonymous OR customer: visitors pass the gate, a signed-in customer skips
  it (reviewed too, never counted). Bot protection runs BEFORE validation, as on /store/contact:
  rate limit → (auth) → honeypot → Turnstile → body validator. /store/cad-downloads/:token* is
  anonymous (the token is the credential) and only rate-limited against floods.
*/
export const storeCadRequestsMiddlewares: MiddlewareRoute[] = [
  {
    methods: ["POST"],
    matcher: "/store/cad-requests",
    middlewares: [
      rateLimit("cad"),
      authenticate("customer", ["session", "bearer"], { allowUnauthenticated: true }),
      cadHoneypot,
      cadTurnstile,
      validateAndTransformBody(StoreCreateCadRequest),
    ],
  },
  {
    methods: ["GET"],
    matcher: "/store/cad-downloads/*",
    middlewares: [rateLimit("cad_download")],
  },
]
