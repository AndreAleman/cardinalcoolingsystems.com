// src/subscribers/admin-notifications.ts
import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'
import { hit } from '../lib/rate-limit'
import { resolveCompanyContext } from '../utils/company-context'
import { CARDINAL_SIGNUP_MAIL_CAP, mailCapVerdict } from '../utils/abuse-policy'

/* How long a fresh registration gets to finish its Company step
   before we tell Cardinal about it on its own. */
const COMPANY_GRACE_MS = Number(process.env.SIGNUP_COMPANY_GRACE_MS ?? 90_000)

type OrderPlacedEvent = {
  id: string
}

type UserCreatedEvent = {
  id: string
}

export default async function adminNotificationHandler({
  event: { name, data },
  container,
}: SubscriberArgs<OrderPlacedEvent | UserCreatedEvent>) {
  console.log(`[AdminSubscriber] Admin notification triggered for event: ${name}`)
  console.log(`[AdminSubscriber] Event data:`, data)

  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const adminEmail = process.env.ADMIN_EMAIL

  if (!adminEmail) {
    console.error('[AdminSubscriber] ❌ ADMIN_EMAIL not set in environment variables')
    return
  }

  try {
    // Handle different event types
    switch (name) {
      case 'order.placed':
        await handleOrderPlaced(data as OrderPlacedEvent, container, notificationModuleService, adminEmail)
        break

      case 'customer.created':
        /*
          One email per signup: a portal signup already sends Cardinal
          the "new Company" email, so the registration email is only
          for an account that never got a Company (the Company step
          failed, or the buyer bailed). Wait out the grace period
          WITHOUT holding the event worker, then decide.
        */
        setTimeout(() => {
          handleUserCreated(data as UserCreatedEvent, container, notificationModuleService, adminEmail).catch(
            (error: any) =>
              console.error('[AdminSubscriber] ❌ Error sending registration notification:', error?.message)
          )
        }, COMPANY_GRACE_MS).unref?.()
        break

      default:
        console.log(`[AdminSubscriber] ⚠️ Unhandled event type: ${name}`)
    }
  } catch (error: any) {
    console.error('[AdminSubscriber] ❌ Error sending admin notification:', error.message)
  }
}

// Handle order.placed event
async function handleOrderPlaced(
  data: OrderPlacedEvent,
  container: any,
  notificationModuleService: INotificationModuleService,
  adminEmail: string
) {
  console.log('[AdminSubscriber] Handling order.placed event for order:', data.id)

  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)

  // Fetch complete order data
  console.log('[AdminSubscriber] Fetching order details...')
  const order = await orderModuleService.retrieveOrder(data.id, {
    relations: ['items', 'summary', 'shipping_address']
  })

  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(
    order.shipping_address.id
  )

  console.log('[AdminSubscriber] Order retrieved:', {
    id: order.id,
    display_id: order.display_id,
    email: order.email,
    total: order.summary?.raw_current_order_total?.value
  })

  const total = Number(order.summary?.raw_current_order_total?.value || 0).toFixed(2)

  console.log(`[AdminSubscriber] Sending admin order notification to: ${adminEmail}`)

  await notificationModuleService.createNotifications({
    to: adminEmail,
    channel: 'email',
    template: EmailTemplates.ADMIN_ORDER,
    data: {
      emailOptions: {
        subject: `New Order #${order.display_id} - $${total}`,
        replyTo: order.email
      },
      order,
      shippingAddress,
      preview: `New order #${order.display_id} from ${order.email}`
    }
  })

  console.log('[AdminSubscriber] ✅ Admin order email sent successfully!')
}

// Handle customer.created event
async function handleUserCreated(
  data: UserCreatedEvent,
  container: any,
  notificationModuleService: INotificationModuleService,
  adminEmail: string
) {
  console.log('[AdminSubscriber] Handling customer.created event for customer:', data.id)

  const query = container.resolve('query')

  // Fetch customer data
  console.log('[AdminSubscriber] Fetching customer details...')
  const {
    data: [customer]
  } = await query.graph({
    entity: 'customer',
    fields: ['id', 'email', 'first_name', 'last_name', 'created_at', 'has_account'],
    filters: { id: data.id }
  })

  if (!customer) {
    console.error('[AdminSubscriber] ❌ Customer not found:', data.id)
    return
  }

  console.log('[AdminSubscriber] Customer retrieved:', {
    id: customer.id,
    email: customer.email,
    name: `${customer.first_name || ''} ${customer.last_name || ''}`
  })

  // Already a Team Member → the "new Company" email covered this signup.
  const membership = await resolveCompanyContext(container, data.id)
  if (membership) {
    console.log('[AdminSubscriber] Customer has a Company; registration email skipped')
    return
  }

  // Same hourly cap as the Company signup email: a flood costs one notice.
  const count = await hit('mail:cardinal-signup', CARDINAL_SIGNUP_MAIL_CAP)
  if (count !== null && mailCapVerdict(count) !== 'send') {
    console.warn('[AdminSubscriber] Signup email cap reached; registration email dropped')
    return
  }

  console.log(`[AdminSubscriber] Sending customer registration notification to: ${adminEmail}`)

  await notificationModuleService.createNotifications({
    to: adminEmail,
    channel: 'email',
    template: EmailTemplates.ADMIN_USER_REGISTERED,
    data: {
      emailOptions: {
        subject: `New Customer Registration - ${customer.email}`,
        replyTo: customer.email
      },
      user: customer,
      preview: `New customer registered: ${customer.email}`
    }
  })

  console.log('[AdminSubscriber] ✅ Admin customer registration email sent successfully!')
}

// Subscribe to multiple events
export const config: SubscriberConfig = {
  event: ['order.placed', 'customer.created']
}
