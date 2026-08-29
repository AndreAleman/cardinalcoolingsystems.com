import { defineMiddlewares, validateAndTransformQuery } from "@medusajs/framework/http"
import { z } from "zod"
import { webhookMiddlewares } from "./webhooks/quickbooks-inventory/middlewares"
import { companyMiddlewares } from "./store/companies/middlewares"
import { adminCompanyMiddlewares } from "./admin/companies/middlewares"

export default defineMiddlewares({
  routes: [
    ...webhookMiddlewares,
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
