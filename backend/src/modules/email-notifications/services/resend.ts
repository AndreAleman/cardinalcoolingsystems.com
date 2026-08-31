import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import {
  Resend,
  CreateEmailOptions,
} from "resend"
import type { ReactNode } from "react"
import { EmailTemplates, generateEmailTemplate } from "../templates"



type ResendOptions = {
  api_key: string
  from: string
  html_templates?: Record<string, {
    subject?: string
    content: string
  }>
}

type InjectedDependencies = {
  logger: Logger
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"
  private resendClient: Resend
  private options: ResendOptions
  private logger: Logger

  constructor(
    { logger }: InjectedDependencies,
    options: ResendOptions
  ) {
    super()
    this.resendClient = new Resend(options.api_key)
    this.options = options
    this.logger = logger
  }

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `api_key` is required in the provider's options."
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Option `from` is required in the provider's options."
      )
    }
  }

  getTemplateSubject(template: string, data: unknown) {
    if (this.options.html_templates?.[template]?.subject) {
      return this.options.html_templates[template].subject
    }
    switch(template) {
      case EmailTemplates.ORDER_PLACED:
        return "Order Confirmation"
      case EmailTemplates.ADMIN_ORDER:
        return "New Order Received"
      case EmailTemplates.CONTACT_FORM:
        return "New Contact Form Submission"
      case EmailTemplates.INVITE_USER:
        return "You've been invited to Cardinal Cooling Systems"
      case EmailTemplates.ADMIN_USER_REGISTERED:
        return "New customer registered"
      case EmailTemplates.OPERATOR_NOTIFIED: {
        const requestType = (data as any)?.requestType
        switch (requestType) {
          case "quote":
            return "New Quote Request"
          case "quote-accepted":
            return "Quote accepted — new order ready"
          case "quote-rejected":
            return "Quote rejected by customer"
          case "quote-message":
            return "Customer replied on a Quote"
          default:
            return "New order placed"
        }
      }
      case EmailTemplates.QUOTE_RECEIVED:
        return "We received your Quote Request"
      case EmailTemplates.PO_UPLOADED:
        return "PO uploaded — check the read-out"
      case EmailTemplates.QUOTE_READY:
        return "Your Quote is ready to review"
      case EmailTemplates.QUOTE_ACCEPTED_CLIENT:
        return "Your order is confirmed"
      case EmailTemplates.APPROVAL_REQUESTED:
        return "A request needs your approval"
      case EmailTemplates.REQUEST_APPROVED:
        return "Your request was approved"
      case EmailTemplates.REQUEST_REJECTED:
        return "Your request was rejected"
      default:
        return "New Email"
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const commonOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template, notification.data),
    }

    let emailOptions: CreateEmailOptions
    const htmlTemplate = this.options.html_templates?.[notification.template]?.content
    if (htmlTemplate) {
      emailOptions = {
        ...commonOptions,
        html: htmlTemplate,
      }
    } else {
      // React Email templates are registered by key in
      // ../templates/index.tsx (generateEmailTemplate validates the
      // payload with the template's isXData guard).
      let reactBody: ReactNode
      try {
        reactBody = generateEmailTemplate(notification.template, notification.data)
      } catch (err: any) {
        this.logger.error(
          `Couldn't find an email template for ${notification.template} (${err?.message ?? err})`
        )
        return {}
      }
      emailOptions = {
        ...commonOptions,
        react: reactBody,
      }
    }

    if (notification.attachments?.length) {
      emailOptions.attachments = notification.attachments.map((attachment) => ({
        content: attachment.content,
        filename: attachment.filename,
        contentType: attachment.content_type,
      }))
    }

    const { data, error } = await this.resendClient.emails.send(emailOptions)

    if (error || !data) {
      if (error) {
        this.logger.error("Failed to send email", error)
      } else {
        this.logger.error("Failed to send email: unknown error")
      }
      return {}
    }

    return { id: data.id }
  }
}

export default ResendNotificationProviderService
