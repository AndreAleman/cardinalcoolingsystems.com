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
import { contactFormEmail } from "../templates/contact-form"
import OrderPlacedTemplate from "../templates/order-placed"
import AdminOrderTemplate from "../templates/admin-order"
import InviteUserEmail from "../templates/invite-user"
import AdminUserRegisteredTemplate from "../templates/admin-user-registered"



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

enum Templates {
  ORDER_PLACED = "order-placed",
  ADMIN_ORDER = "admin-order",
  CONTACT_FORM = "contact-form",
  INVITE_USER = "invite-user",
  ADMIN_USER_REGISTERED = "admin-user-registered",
}

const templates: {[key in Templates]?: (props: unknown) => React.ReactNode} = {
  [Templates.ORDER_PLACED]: OrderPlacedTemplate,
  [Templates.ADMIN_ORDER]: AdminOrderTemplate,
  [Templates.CONTACT_FORM]: contactFormEmail,
  [Templates.INVITE_USER]: InviteUserEmail as (props: unknown) => React.ReactNode,
  [Templates.ADMIN_USER_REGISTERED]: AdminUserRegisteredTemplate as (props: unknown) => React.ReactNode,
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

  getTemplate(template: Templates) {
    if (this.options.html_templates?.[template]) {
      return this.options.html_templates[template].content
    }
    const allowedTemplates = Object.keys(templates)

    if (!allowedTemplates.includes(template)) {
      return null
    }

    return templates[template]
  }

  getTemplateSubject(template: Templates) {
    if (this.options.html_templates?.[template]?.subject) {
      return this.options.html_templates[template].subject
    }
    switch(template) {
      case Templates.ORDER_PLACED:
        return "Order Confirmation"
      case Templates.ADMIN_ORDER:        // ← add here
        return "New Order Received"      // ← and here
      case Templates.CONTACT_FORM:
        return "New Contact Form Submission"
      case Templates.INVITE_USER:
        return "You've been invited to Cardinal Cooling Systems"
      case Templates.ADMIN_USER_REGISTERED:
        return "New customer registered"
      default:
        return "New Email"
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const template = this.getTemplate(notification.template as Templates)

    if (!template) {
      this.logger.error(`Couldn't find an email template for ${notification.template}`)
      return {}
    }

    const commonOptions = {
      from: this.options.from,
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template as Templates),
    }

    let emailOptions: CreateEmailOptions
    if (typeof template === "string") {
      emailOptions = {
        ...commonOptions,
        html: template,
      }
    } else {
      emailOptions = {
        ...commonOptions,
        react: template(notification.data),
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
