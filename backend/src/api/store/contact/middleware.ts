import { defineMiddlewares } from "@medusajs/framework/http"
import { validateAndTransformBody } from "@medusajs/framework"
import { ContactFormSchema } from "./validators"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/contact",
      method: "POST",
      middlewares: [
        validateAndTransformBody(ContactFormSchema)
      ]
    }
  ]
})
