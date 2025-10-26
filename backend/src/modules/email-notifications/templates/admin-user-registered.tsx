// src/modules/email-notifications/templates/admin-user-registered.tsx
import { Text, Section, Hr, Link } from '@react-email/components'
import * as React from 'react'
import { Base } from './base'

export const ADMIN_USER_REGISTERED = 'admin-user-registered'

export interface AdminUserRegisteredProps {
  user: {
    id: string
    email: string
    first_name?: string
    last_name?: string
    created_at: string
  }
  preview?: string
}

export const isAdminUserRegisteredData = (data: any): data is AdminUserRegisteredProps =>
  typeof data.user === 'object' && typeof data.user.email === 'string'

export const AdminUserRegisteredTemplate: React.FC<AdminUserRegisteredProps> & {
  PreviewProps?: AdminUserRegisteredProps
} = ({ user, preview = 'New user registration - Admin notification' }) => {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:9000'
  const userName = user.first_name && user.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : 'No name provided'

  return (
    <Base preview={preview}>
      <Section style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>NEW USER REGISTRATION</Text>
        
        {/* User Details */}
        <Section style={styles.section}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user.email}</Text>
          
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{userName}</Text>
          
          <Text style={styles.label}>Registered:</Text>
          <Text style={styles.value}>
            {new Date(user.created_at).toLocaleString()}
          </Text>
        </Section>

        <Hr style={styles.divider} />

        {/* Status */}
        <Section style={styles.section}>
          <Text style={styles.statusLabel}>Status:</Text>
          <Text style={styles.statusValue}>
            ⏳ Awaiting B2B pricing approval
          </Text>
        </Section>

        <Hr style={styles.divider} />

        {/* Admin Link */}
        <Section style={styles.section}>
          <Link 
            href={`${backendUrl}/app/customers/${user.id}`}
            style={styles.link}
          >
            → View User in Admin
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
AdminUserRegisteredTemplate.PreviewProps = {
  user: {
    id: 'user_test123',
    email: 'newcustomer@example.com',
    first_name: 'Jane',
    last_name: 'Doe',
    created_at: new Date().toISOString()
  }
} as AdminUserRegisteredProps

// Styles - Plain and minimal
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
  statusLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
    textTransform: 'uppercase' as const,
    fontWeight: 'bold'
  },
  statusValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ff8c00',
    marginBottom: '12px'
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

export default AdminUserRegisteredTemplate
