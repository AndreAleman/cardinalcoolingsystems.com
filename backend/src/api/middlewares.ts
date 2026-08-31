import { defineMiddlewares, validateAndTransformQuery } from "@medusajs/framework/http"
import { z } from "zod"
import { webhookMiddlewares } from "./webhooks/quickbooks-inventory/middlewares"
import { companyMiddlewares } from "./store/companies/middlewares"
import { adminCompanyMiddlewares } from "./admin/companies/middlewares"
import { orderFormMiddlewares } from "./store/order-form/middlewares"
import { storeQuotesMiddlewares } from "./store/quotes/middlewares"
import { adminQuotesMiddlewares } from "./admin/quotes/middlewares"
import { storeApprovalsMiddlewares } from "./store/approvals/middlewares"
import { adminApprovalsMiddlewares } from "./admin/approvals/middlewares"
import { adminOrdersMiddlewares } from "./admin/orders/middlewares"

export default defineMiddlewares({
  routes: [
    ...webhookMiddlewares,
    ...companyMiddlewares,
    ...adminCompanyMiddlewares,
    ...orderFormMiddlewares,
    ...storeQuotesMiddlewares,
    ...adminQuotesMiddlewares,
    ...storeApprovalsMiddlewares,
    ...adminApprovalsMiddlewares,
    ...adminOrdersMiddlewares,
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
