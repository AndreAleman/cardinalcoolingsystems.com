import { ContainerRegistrationKeys, Modules } from '@medusajs/framework/utils'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { STOREFRONT_URL } from '../lib/constants'

/*
  Customer forgot-password email. Medusa emits `auth.password_reset`
  when POST /auth/customer/emailpass/reset-password is called; the
  payload carries the identifier (the email), a short-lived token, and
  the actor type. We only act for customers — admin users are
  staff-managed and never get this email.

  The reset page lives at /{countryCode}/reset-password on the
  storefront (it must work logged out, so it sits OUTSIDE the
  /account parallel-route gate — keep this URL in sync with
  storefront/src/app/[countryCode]/(main)/reset-password/page.tsx).

  Best-effort like every email step in this repo: failure logs and
  returns, never throws.
*/

export default async function customerPasswordResetHandler({
  event: { data },
  container,
}: SubscriberArgs<{ entity_id: string; token: string; actor_type: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const tag = '[auth] customer-password-reset'

  const { entity_id: email, token, actor_type } = data ?? ({} as any)

  if (actor_type !== 'customer') {
    logger.info(`${tag}: ignoring password reset for actor_type "${actor_type}".`)
    return
  }

  if (!email || !token) {
    logger.warn(`${tag}: event missing email or token; skipping.`)
    return
  }

  let notificationModule: any
  try {
    notificationModule = container.resolve(Modules.NOTIFICATION)
  } catch {
    logger.warn(`${tag}: Modules.NOTIFICATION not registered; skipping.`)
    return
  }

  const resetUrl = `${STOREFRONT_URL.replace(/\/+$/, '')}/us/reset-password?token=${encodeURIComponent(
    token
  )}&email=${encodeURIComponent(email)}`

  try {
    await notificationModule.createNotifications({
      to: email,
      channel: 'email',
      template: EmailTemplates.PASSWORD_RESET,
      data: {
        resetUrl,
        preview: 'Set a new password for your Cardinal account',
      },
    })
    logger.info(`${tag}: sent to ${email}.`)
  } catch (err: any) {
    logger.error(`${tag}: send to ${email} failed: ${err?.message ?? err}`)
  }
}

export const config: SubscriberConfig = {
  event: 'auth.password_reset',
}
