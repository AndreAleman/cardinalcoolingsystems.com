import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { ContactFormType } from "./validators"
import { scamSignals } from "./scam-signals"

export async function POST(
  req: MedusaRequest<ContactFormType>,
  res: MedusaResponse
): Promise<void> {
  // Use req.body instead of req.validatedBody if validator isn't applied
  const { name, lastName, email, phone, message, attachments } =
    req.validatedBody || req.body

  const scam = scamSignals({ message, phone, email })

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
      attachmentFilenames: attachments?.map((a) => a.filename) ?? [],
      scamReasons: scam.reasons,
    },
    attachments: attachments?.length
      ? attachments.map((a) => ({
          filename: a.filename,
          content_type: a.content_type,
          content: a.content,
          disposition: "attachment",
        }))
      : null,
  })

  // The storefront records the flag on its analytics event so suspected scams
  // stop counting as leads.
  res.json({ success: true, suspectedScam: scam.suspected })
}

