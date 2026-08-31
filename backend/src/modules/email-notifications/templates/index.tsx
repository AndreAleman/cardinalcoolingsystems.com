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
import { OperatorNotifiedTemplate, OPERATOR_NOTIFIED, isOperatorNotifiedData } from './operator-notified'
import { QuoteReceivedTemplate, QUOTE_RECEIVED, isQuoteReceivedData } from './quote-received'
import { QuoteReadyTemplate, QUOTE_READY, isQuoteReadyData } from './quote-ready'
import { QuoteAcceptedClientTemplate, QUOTE_ACCEPTED_CLIENT, isQuoteAcceptedClientData } from './quote-accepted-client'
import { ApprovalRequestedTemplate, APPROVAL_REQUESTED, isApprovalRequestedData } from './approval-requested'
import { RequestApprovedTemplate, REQUEST_APPROVED, isRequestApprovedData } from './request-approved'
import { RequestRejectedTemplate, REQUEST_REJECTED, isRequestRejectedData } from './request-rejected'
import { PoUploadedTemplate, PO_UPLOADED, isPoUploadedData } from './po-uploaded'

export const EmailTemplates = {
  INVITE_USER,
  ORDER_PLACED,
  ADMIN_ORDER,
  ADMIN_USER_REGISTERED,
  COMPANY_WELCOME,
  COMPANY_SIGNUP_ADMIN,
  COMPANY_DECIDED,
  COMPANY_INVITE,
  OPERATOR_NOTIFIED,
  QUOTE_RECEIVED,
  QUOTE_READY,
  QUOTE_ACCEPTED_CLIENT,
  APPROVAL_REQUESTED,
  REQUEST_APPROVED,
  REQUEST_REJECTED,
  PO_UPLOADED,
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

    case EmailTemplates.OPERATOR_NOTIFIED:
      if (!isOperatorNotifiedData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.OPERATOR_NOTIFIED}"`)
      }
      return <OperatorNotifiedTemplate {...data} />

    case EmailTemplates.QUOTE_RECEIVED:
      if (!isQuoteReceivedData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.QUOTE_RECEIVED}"`)
      }
      return <QuoteReceivedTemplate {...data} />

    case EmailTemplates.PO_UPLOADED:
      if (!isPoUploadedData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.PO_UPLOADED}"`)
      }
      return <PoUploadedTemplate {...data} />

    case EmailTemplates.QUOTE_READY:
      if (!isQuoteReadyData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.QUOTE_READY}"`)
      }
      return <QuoteReadyTemplate {...data} />

    case EmailTemplates.QUOTE_ACCEPTED_CLIENT:
      if (!isQuoteAcceptedClientData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.QUOTE_ACCEPTED_CLIENT}"`)
      }
      return <QuoteAcceptedClientTemplate {...data} />

    case EmailTemplates.APPROVAL_REQUESTED:
      if (!isApprovalRequestedData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.APPROVAL_REQUESTED}"`)
      }
      return <ApprovalRequestedTemplate {...data} />

    case EmailTemplates.REQUEST_APPROVED:
      if (!isRequestApprovedData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.REQUEST_APPROVED}"`)
      }
      return <RequestApprovedTemplate {...data} />

    case EmailTemplates.REQUEST_REJECTED:
      if (!isRequestRejectedData(data)) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `Invalid data for template "${EmailTemplates.REQUEST_REJECTED}"`)
      }
      return <RequestRejectedTemplate {...data} />

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
