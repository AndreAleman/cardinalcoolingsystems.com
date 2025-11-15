import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { sendContactFormNotificationStep } from "./steps/send-contact-form-notification"

type WorkflowInput = {
  name: string
  lastName: string
  email: string
  phone?: string
  message: string
  recipientEmail: string
}

export const sendContactFormEmailWorkflow = createWorkflow(
  "send-contact-form-email",
  (input: WorkflowInput) => {
    const notification = sendContactFormNotificationStep(input)
    
    return new WorkflowResponse(notification)
  }
)
