// src/modules/email-notifications/templates/admin-order.tsx
import { Text, Section, Hr, Link } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'
import { OrderDTO, OrderAddressDTO } from '@medusajs/framework/types'

export const ADMIN_ORDER = 'admin-order'

export interface AdminOrderTemplateProps {
  order: OrderDTO & { 
    display_id: string
    summary: { raw_current_order_total: { value: number } }
  }
  shippingAddress: OrderAddressDTO
  preview?: string
}

export const isAdminOrderData = (data: any): data is AdminOrderTemplateProps =>
  typeof data.order === 'object' && typeof data.shippingAddress === 'object'

export const AdminOrderTemplate: React.FC<AdminOrderTemplateProps> & {
  PreviewProps?: AdminOrderTemplateProps
} = ({ 

  order, 
  shippingAddress,
  preview = 'New order received - Admin notification'
}) => {
  const total = order.summary.raw_current_order_total.value.toFixed(2)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000'
  
  return (
    <Base preview={preview}>
      <Section style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>NEW ORDER NOTIFICATION</Text>
        
        {/* Order Summary */}
        <Section style={styles.section}>
          <Text style={styles.label}>Order:</Text>
          <Text style={styles.value}>#{order.display_id}</Text>
          
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>
            {new Date(order.created_at).toLocaleString()}
          </Text>
          
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>
            {shippingAddress.first_name} {shippingAddress.last_name}
          </Text>
          <Text style={styles.valueSmall}>
            {order.email}
          </Text>
          
          <Text style={styles.label}>Total:</Text>
          <Text style={styles.valueHighlight}>
            ${total} {order.currency_code.toUpperCase()}
          </Text>
        </Section>

        <Hr style={styles.divider} />

        {/* Items */}
        <Section style={styles.section}>
          <Text style={styles.sectionTitle}>
            ITEMS ({order.items?.length || 0}):
          </Text>
          
          {order.items?.map((item) => (
            <Text key={item.id} style={styles.item}>
              • {item.product_title} ({item.variant_sku || 'N/A'})
              <br />
              &nbsp;&nbsp;Qty: {item.quantity} × ${item.unit_price.toFixed(2)} = ${(item.quantity * item.unit_price).toFixed(2)}
            </Text>
          ))}
        </Section>

        <Hr style={styles.divider} />

        {/* Shipping Address */}
        <Section style={styles.section}>
          <Text style={styles.sectionTitle}>SHIPPING ADDRESS:</Text>
          <Text style={styles.address}>
            {shippingAddress.first_name} {shippingAddress.last_name}<br />
            {shippingAddress.address_1}<br />
            {shippingAddress.address_2 && <>{shippingAddress.address_2}<br /></>}
            {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}<br />
            {shippingAddress.country_code?.toUpperCase()}
          </Text>
        </Section>

        <Hr style={styles.divider} />

        {/* Admin Dashboard Link */}
        <Section style={styles.section}>
          <Link 
            href={`${backendUrl}/app/orders/${order.id}`}
            style={styles.link}
          >
            → View in Admin Dashboard
          </Link>
        </Section>

        {/* Footer */}
        <Text style={styles.footer}>
          This is an automated admin notification.
        </Text>
      </Section>
    </Base>
  )
}

// Preview props for email dev server
AdminOrderTemplate.PreviewProps = {
  order: {
    id: 'order_test123',
    display_id: '1001',
    created_at: new Date().toISOString(),
    email: 'customer@example.com',
    currency_code: 'usd',
    items: [
      {
        id: 'item_1',
        title: 'T304 Stainless Steel',
        product_title: 'Industrial Cooling Unit - Model 13H',
        variant_sku: '13H-300',
        quantity: 2,
        unit_price: 625.00
      },
      {
        id: 'item_2',
        title: '4" Diameter',
        product_title: 'Cooling Fan Assembly',
        variant_sku: 'FAN-200',
        quantity: 4,
        unit_price: 150.00
      }
    ],
    summary: {
      raw_current_order_total: { value: 1850.00 }
    }
  } as any,
  shippingAddress: {
    first_name: 'John',
    last_name: 'Smith',
    address_1: '1200 NW 14th Ter',
    city: 'Cape Coral',
    province: 'FL',
    postal_code: '33993',
    country_code: 'US'
  }
} as AdminOrderTemplateProps

// Styles - Plain and minimal for admin
const styles = {
  container: {
    padding: '20px',
    fontFamily: 'monospace, sans-serif'
  },
  title: {
    fontSize: '20px',
    fontWeight: 'bold',
    marginBottom: '20px',
    textTransform: 'uppercase' as const,
    letterSpacing: '1px'
  },
  section: {
    marginBottom: '15px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '10px',
    textTransform: 'uppercase' as const
  },
  label: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '2px',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold'
  },
  value: {
    fontSize: '14px',
    marginBottom: '12px',
    color: '#000'
  },
  valueSmall: {
    fontSize: '13px',
    marginBottom: '12px',
    color: '#555'
  },
  valueHighlight: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#000'
  },
  item: {
    fontSize: '13px',
    marginBottom: '8px',
    lineHeight: '1.5',
    color: '#333'
  },
  address: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#333'
  },
  divider: {
    borderColor: '#ddd',
    margin: '20px 0'
  },
  link: {
    fontSize: '14px',
    color: '#0066cc',
    textDecoration: 'none',
    fontWeight: 'bold'
  },
  footer: {
    fontSize: '11px',
    color: '#999',
    marginTop: '30px',
    fontStyle: 'italic' as const
  }
}

export default AdminOrderTemplate
