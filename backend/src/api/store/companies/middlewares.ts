import { authenticate, MiddlewareRoute } from "@medusajs/framework/http";

export const companyMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/store/companies/me",
    methods: ["GET"],
    middlewares: [authenticate("customer", ["session", "bearer"])],
  },
];
