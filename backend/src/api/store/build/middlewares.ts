import {
  authenticate,
  MiddlewareRoute,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import { StoreBuildQuoteLines, StoreBuildResolve } from "./validators"

/* Cardinal Builder store routes. Auth is optional: a signed-in buyer of an
   Approved Company is priced on the Company price list (plan B2). */
const optionalCustomer = authenticate("customer", ["session", "bearer"], {
  allowUnauthenticated: true,
})

export const storeBuildMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/build/resolve",
    methods: ["POST"],
    middlewares: [optionalCustomer, validateAndTransformBody(StoreBuildResolve)],
  },
  {
    matcher: "/store/build/quote-lines",
    methods: ["POST"],
    middlewares: [optionalCustomer, validateAndTransformBody(StoreBuildQuoteLines)],
  },
]
