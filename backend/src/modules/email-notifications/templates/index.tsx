// src/modules/email-notifications/templates/index.tsx
import { ReactNode } from 'react'
import { MedusaError } from '@medusajs/framework/utils'
import { InviteUserEmail, INVITE_USER, isInviteUserData } from './invite-user'
import { OrderPlacedTemplate, ORDER_PLACED, isOrderPlacedTemplateData } from './order-placed'
import { AdminOrderTemplate, ADMIN_ORDER, isAdminOrderData } from './admin-order'
import { AdminUserRegisteredTemplate, ADMIN_USER_REGISTERED, isAdminUserRegisteredData } from './admin-user-registered'
import { contactFormEmail } from './contact-form'  // ✅ Changed: removed other imports

export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  ADMIN_ORDER,
  ADMIN_USER_REGISTERED,
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
