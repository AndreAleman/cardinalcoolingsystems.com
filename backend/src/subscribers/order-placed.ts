import { Modules } from '@medusajs/framework/utils'
import { INotificationModuleService, IOrderModuleService } from '@medusajs/framework/types'
import { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa'
import { EmailTemplates } from '../modules/email-notifications/templates'

export default async function orderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  console.log('[OrderSubscriber] Order placed event received:', data.id)
  
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)
  const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER)
  
  console.log('[OrderSubscriber] Fetching order details...')
  const order = await orderModuleService.retrieveOrder(data.id, { relations: ['items', 'summary', 'shipping_address'] })
  const shippingAddress = await (orderModuleService as any).orderAddressService_.retrieve(order.shipping_address.id)

  console.log('[OrderSubscriber] Order retrieved:', { 
    id: order.id, 
    email: order.email,
    items: order.items?.length 
  })

  try {
    console.log('[OrderSubscriber] Sending email to:', order.email)
    
    await notificationModuleService.createNotifications({
      to: order.email,
      channel: 'email',
      template: EmailTemplates.ORDER_PLACED,
      data: {
        emailOptions: {
          replyTo: 'aleman@cardinalcoolingsystems.com',
          subject: `Order Confirmation - ${order.display_id || 'Your Order'}`
        },
        order,
        shippingAddress,
        preview: 'Thank you for your order from Cardinal Cooling Systems!'
      }
    })
    
    console.log('[OrderSubscriber] ✅ Email sent successfully!')
  } catch (error) {
    console.error('[OrderSubscriber] ❌ Error sending order confirmation:', error)
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
}
