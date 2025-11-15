import { Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type ContactFormData = {
  name: string
  lastName: string
  email: string
  phone?: string
  message: string
  recipientEmail: string
}

export const sendContactFormNotificationStep = createStep(
  "send-contact-form-notification",
  async (data: ContactFormData, { container }) => {
    const notificationModuleService = container.resolve(Modules.NOTIFICATION)
    
    const notification = await notificationModuleService.createNotifications({
      to: data.recipientEmail,
      channel: "email",
      template: "contact-form",
      data: {
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        message: data.message,
      },
    })
    
    return new StepResponse(notification)
  }
)
