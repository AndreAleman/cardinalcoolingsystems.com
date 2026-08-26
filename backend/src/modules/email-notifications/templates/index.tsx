// src/modules/email-notifications/templates/index.tsx
import { ReactNode } from 'react'
import { MedusaError } from '@medusajs/framework/utils'
import { InviteUserEmail, INVITE_USER, isInviteUserData } from './invite-user'
import { OrderPlacedTemplate, ORDER_PLACED, isOrderPlacedTemplateData } from './order-placed'
import { AdminOrderTemplate, ADMIN_ORDER, isAdminOrderData } from './admin-order'
import { AdminUserRegisteredTemplate, ADMIN_USER_REGISTERED, isAdminUserRegisteredData } from './admin-user-registered'
import { contactFormEmail } from './contact-form'
import { CompanyWelcomeTemplate, COMPANY_WELCOME, isCompanyWelcomeData } from './company-welcome'
import { CompanySignupAdminTemplate, COMPANY_SIGNUP_ADMIN, isCompanySignupAdminData } from './company-signup-admin'
import { CompanyDecidedTemplate, COMPANY_DECIDED, isCompanyDecidedData } from './company-decided'
import { CompanyInviteTemplate, COMPANY_INVITE, isCompanyInviteData } from './company-invite'

export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  ADMIN_ORDER,
  ADMIN_USER_REGISTERED,
  COMPANY_WELCOME,
  COMPANY_SIGNUP_ADMIN,
  COMPANY_DECIDED,
  COMPANY_INVITE,
  CONTACT_FORM: 'contact-form'  // ✅ Changed: simple string constant
} as const

export type EmailTemplateType = keyof typeof EmailTemplates

export function generateEmailTemplate(templateKey: string, data: unknown): ReactNode {
  console.log(`[Templates] Generating email template: ${templateKey}`)
  
  switch (templateKey) {
    case EmailTemplates.INVITE_USER:
      if (!isInviteUserData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.INVITE_USER}"`
        )
      }
      return <InviteUserEmail {...data} />

    case EmailTemplates.ORDER_PLACED:
      if (!isOrderPlacedTemplateData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ORDER_PLACED}"`
        )
      }
      return <OrderPlacedTemplate {...data} />

    case EmailTemplates.ADMIN_ORDER:
      console.log('[Templates] Using ADMIN_ORDER template')
      if (!isAdminOrderData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ADMIN_ORDER}"`
        )
      }
      return <AdminOrderTemplate {...data} />

    case EmailTemplates.ADMIN_USER_REGISTERED:
      console.log('[Templates] Using ADMIN_USER_REGISTERED template')
      if (!isAdminUserRegisteredData(data)) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid data for template "${EmailTemplates.ADMIN_USER_REGISTERED}"`
        )
      }
      return <AdminUserRegisteredTemplate {...data} />

    case EmailTemplates.COMPANY_WELCOME:
      if (!isCompanyWelcomeData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.COMPANY_WELCOME}"`)
      }
      return <CompanyWelcomeTemplate {...data} />

    case EmailTemplates.COMPANY_SIGNUP_ADMIN:
      if (!isCompanySignupAdminData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.COMPANY_SIGNUP_ADMIN}"`)
      }
      return <CompanySignupAdminTemplate {...data} />

    case EmailTemplates.COMPANY_DECIDED:
      if (!isCompanyDecidedData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.COMPANY_DECIDED}"`)
      }
      return <CompanyDecidedTemplate {...data} />

    case EmailTemplates.COMPANY_INVITE:
      if (!isCompanyInviteData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.COMPANY_INVITE}"`)
      }
      return <CompanyInviteTemplate {...data} />

    case EmailTemplates.CONTACT_FORM:  // ✅ Simplified case
      console.log('[Templates] Using CONTACT_FORM template')
      return contactFormEmail(data as any)  // Using the actual export from contact-form.tsx

    default:
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Unknown template key: "${templateKey}"`
      )
  }
}
