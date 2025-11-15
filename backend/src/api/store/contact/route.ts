import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ContactFormType } from "./validators"

export async function POST(
  req: MedusaRequest<ContactFormType>,
  res: MedusaResponse
): Promise<void> {
  // Use req.body instead of req.validatedBody if validator isn't applied
  const { name, lastName, email, phone, message } = req.validatedBody || req.body

  const notificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

  await notificationModuleService.createNotifications({
    to: process.env.CONTACT_FORM_EMAIL || "aleman@cardinalcoolingsystems.com",
    channel: "email",
    template: "contact-form",
    data: {
      name,
      lastName,
      email,
      phone: phone || "Not provided",
      message,
    },
  })

  res.json({ success: true })
}

