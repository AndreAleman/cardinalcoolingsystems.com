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

// Account-lifecycle emails come from info@; sales notifications keep
// the module-configured sender (this.options.from).
const INFO_FROM =
  process.env.RESEND_INFO_FROM_EMAIL ??
  "Cardinal Cooling Systems <info@cardinalcoolingsystems.com>"

const TEMPLATE_FROM: Record<string, string> = {
  "password-reset": INFO_FROM,
  "company-invite": INFO_FROM,
  "company-welcome": INFO_FROM,
  "company-decided": INFO_FROM,
  "invite-user": INFO_FROM,
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

  getFrom(template: string) {
    return TEMPLATE_FROM[template] ?? this.options.from
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
      case EmailTemplates.CONTACT_FORM: {
        // Name the sender so the lead is recognizable in the inbox and can't be
        // swallowed by a filter keyed on a generic subject.
        const d = data as { name?: string; lastName?: string; email?: string; scamReasons?: string[] } | undefined
        const who = [d?.name, d?.lastName].filter(Boolean).join(" ")
        const domain = d?.email?.split("@")[1]
        const tail = [who, domain].filter(Boolean).join(" — ")
        const subject = tail ? `Quote request from ${tail}` : "New quote request"
        return d?.scamReasons?.length ? `[Likely scam] ${subject}` : subject
      }
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
      case EmailTemplates.COMPANY_SIGNUP_ADMIN: {
        const name = (data as any)?.company_name ?? "a company"
        if ((data as any)?.flood) return "Signup volume is unusually high — check Medusa Admin"
        return (data as any)?.status === "approved"
          ? `New signup (auto-approved): ${name}`
          : `Needs your approval: ${name}`
      }
      case EmailTemplates.COMPANY_WELCOME:
        return "Welcome to Cardinal — your company dashboard and 10% code"
      case EmailTemplates.COMPANY_DECIDED:
        return (data as any)?.status === "approved"
          ? "Your company dashboard is unlocked"
          : "About your Cardinal company account"
      case EmailTemplates.PASSWORD_RESET:
        return "Reset your Cardinal password"
      default:
        return "New Email"
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    // Contact-form leads reply straight to the buyer, not to the sending address.
    const replyTo =
      notification.template === EmailTemplates.CONTACT_FORM
        ? (notification.data as { email?: string } | undefined)?.email
        : undefined
    const commonOptions = {
      from: this.getFrom(notification.template),
      to: [notification.to],
      subject: this.getTemplateSubject(notification.template, notification.data),
      ...(replyTo ? { replyTo } : {}),
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
