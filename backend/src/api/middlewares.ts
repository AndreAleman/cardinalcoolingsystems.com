import { defineMiddlewares, validateAndTransformQuery } from "@medusajs/framework/http"
import { z } from "zod"
import { companyMiddlewares } from "./store/companies/middlewares"
import { adminCompanyMiddlewares } from "./admin/companies/middlewares"

export default defineMiddlewares({
  routes: [
    ...companyMiddlewares,
    ...adminCompanyMiddlewares,
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
  ],
})
