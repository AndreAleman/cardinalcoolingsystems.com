import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Row,
  Column,
  Text,
  Img,
  Hr,
} from '@react-email/components';

interface PurchaseOrderProps {
  poNumber: string;
  poDate: string;
  vendorName: string;
  vendorAddress: {
    line1: string;
    line2?: string;
    city: string;
    postal: string;
    country: string;
  };
  shipTo: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    postal: string;
    country: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    sku?: string;
  }>;
  terms?: string;
  notes?: string;
}

export default function PurchaseOrder({
  poNumber = "PO-001",
  poDate = "2025-12-15",
  vendorName = "Vendor Name",
  vendorAddress = {
    line1: "123 Vendor St",
    city: "City",
    postal: "12345",
    country: "USA"
  },
  shipTo = {
    name: "Cardinal Cooling Systems",
    line1: "Your Address",
    city: "Your City",
    postal: "12345",
    country: "USA"
  },
  items = [],
  terms = "Net 30",
  notes = ""
}: PurchaseOrderProps) {
  
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Logo */}
          <Section style={styles.logoSection}>
            <Img
              src="https://cardinalcoolingsystems.com/images/logo/logo-main-3.svg"
              alt="Logo"
              width="300"
              height="90"
            />
          </Section>

          {/* Header */}
          <Section style={styles.header}>
            <Text style={styles.title}>PURCHASE ORDER</Text>
          </Section>

          {/* PO Info */}
          <Section style={styles.section}>
            <Row>
              <Column style={{ width: '50%' }}>
                <Text style={styles.label}>PO Number: {poNumber}</Text>
                <Text style={styles.label}>Date: {poDate}</Text>
              </Column>
              <Column style={{ width: '50%', textAlign: 'right' }}>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Vendor and Ship To */}
          <Section style={styles.section}>
            <Row>
              <Column style={{ width: '50%' }}>
                <Text style={styles.sectionTitle}>Vendor:</Text>
                <Text style={styles.text}>{vendorName}</Text>
                <Text style={styles.text}>{vendorAddress.line1}</Text>
                {vendorAddress.line2 && (
                  <Text style={styles.text}>{vendorAddress.line2}</Text>
                )}
                <Text style={styles.text}>
                  {vendorAddress.city}, {vendorAddress.postal}
                </Text>
                <Text style={styles.text}>{vendorAddress.country}</Text>
              </Column>
              <Column style={{ width: '50%' }}>
                <Text style={styles.sectionTitle}>Ship To:</Text>
                <Text style={styles.text}>{shipTo.name}</Text>
                <Text style={styles.text}>{shipTo.line1}</Text>
                {shipTo.line2 && (
                  <Text style={styles.text}>{shipTo.line2}</Text>
                )}
                <Text style={styles.text}>
                  {shipTo.city}, {shipTo.postal}
                </Text>
                <Text style={styles.text}>{shipTo.country}</Text>
              </Column>
            </Row>
          </Section>

          <Hr style={styles.hr} />

          {/* Items Table */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Items:</Text>
            
            <Row style={styles.tableHeader}>
              <Column style={{ width: '40%' }}>
                <Text style={styles.tableHeaderText}>Description</Text>
              </Column>
              <Column style={{ width: '15%', textAlign: 'center' }}>
                <Text style={styles.tableHeaderText}>Qty</Text>
              </Column>
              <Column style={{ width: '20%', textAlign: 'right' }}>
                <Text style={styles.tableHeaderText}>Unit Price</Text>
              </Column>
              <Column style={{ width: '25%', textAlign: 'right' }}>
                <Text style={styles.tableHeaderText}>Total</Text>
              </Column>
            </Row>

            {items.map((item, index) => (
              <Row key={index} style={styles.tableRow}>
                <Column style={{ width: '40%' }}>
                  <Text style={styles.tableText}>{item.description}</Text>
                  {item.sku && (
                    <Text style={styles.tableTextSmall}>SKU: {item.sku}</Text>
                  )}
                </Column>
                <Column style={{ width: '15%', textAlign: 'center' }}>
                  <Text style={styles.tableText}>{item.quantity}</Text>
                </Column>
                <Column style={{ width: '20%', textAlign: 'right' }}>
                  <Text style={styles.tableText}>${item.unitPrice.toFixed(2)}</Text>
                </Column>
                <Column style={{ width: '25%', textAlign: 'right' }}>
                  <Text style={styles.tableText}>
                    ${(item.quantity * item.unitPrice).toFixed(2)}
                  </Text>
                </Column>
              </Row>
            ))}

            {/* Subtotal */}
            <Row style={styles.totalRow}>
              <Column style={{ width: '75%', textAlign: 'right' }}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
              </Column>
              <Column style={{ width: '25%', textAlign: 'right' }}>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </Column>
            </Row>
          </Section>

          {notes && (
            <>
              <Hr style={styles.hr} />
              <Section style={styles.section}>
                <Text style={styles.sectionTitle}>Notes:</Text>
                <Text style={styles.text}>{notes}</Text>
              </Section>
            </>
          )}

          <Hr style={styles.hr} />

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Please confirm receipt of this purchase order.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#ffffff',
    margin: 0,
    padding: 0,
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
  },
  logoSection: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '30px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0',
  },
  section: {
    marginBottom: '20px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  label: {
    fontSize: '14px',
    margin: '5px 0',
  },
  text: {
    fontSize: '14px',
    margin: '3px 0',
  },
  hr: {
    borderColor: '#e0e0e0',
    margin: '20px 0',
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    padding: '10px 0',
  },
  tableHeaderText: {
    fontSize: '12px',
    fontWeight: 'bold',
    margin: '5px 0',
  },
  tableRow: {
    borderBottom: '1px solid #e0e0e0',
    padding: '10px 0',
  },
  tableText: {
    fontSize: '14px',
    margin: '5px 0',
  },
  tableTextSmall: {
    fontSize: '12px',
    color: '#666',
    margin: '5px 0',
  },
  totalRow: {
    padding: '10px 0',
    marginTop: '10px',
  },
  totalLabel: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '5px 0',
  },
  totalValue: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '5px 0',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '30px',
  },
  footerText: {
    fontSize: '14px',
    color: '#666',
  },
};
