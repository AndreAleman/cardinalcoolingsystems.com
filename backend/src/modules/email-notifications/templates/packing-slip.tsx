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


interface PackingSlipProps {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  clientPoNumber?: string; // Added client PO number field
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    postal: string;
    country: string;
  };
  items: Array<{
    title: string;
    variant: string;
    quantity: number;
    sku: string;
  }>;
}


export default function PackingSlip({
  orderNumber = "1001",
  orderDate = "2025-11-18",
  customerName = "John Doe",
  clientPoNumber, // Added client PO number parameter
  shippingAddress = {
    line1: "123 Main St",
    city: "New York",
    postal: "10001",
    country: "USA"
  },
  items = [
    { title: "Sample Product", variant: "Medium", quantity: 2, sku: "SKU-001" }
  ]
}: PackingSlipProps) {
  return (
    <Html>
      <Head />
      <Body style={styles.body}>
        <Container style={styles.container}>
          {/* Logo - Bigger */}
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
            <Text style={styles.title}>PACKING SLIP</Text>
          </Section>


          {/* Order Info */}
          <Section style={styles.section}>
            <Row>
              <Column>
                <Text style={styles.label}>Order #: {orderNumber}</Text>
                <Text style={styles.label}>Date: {orderDate}</Text>
                {clientPoNumber && (
                  <Text style={styles.label}>Client PO #: {clientPoNumber}</Text>
                )}
              </Column>
            </Row>
          </Section>


          {/* Ship To */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Ship To:</Text>
            <Text style={styles.text}>{customerName}</Text>
            <Text style={styles.text}>{shippingAddress.line1}</Text>
            {shippingAddress.line2 && (
              <Text style={styles.text}>{shippingAddress.line2}</Text>
            )}
            <Text style={styles.text}>
              {shippingAddress.city}, {shippingAddress.postal}
            </Text>
            <Text style={styles.text}>{shippingAddress.country}</Text>
          </Section>


          <Hr style={styles.hr} />


          {/* Items Table */}
          <Section style={styles.section}>
            <Text style={styles.sectionTitle}>Items:</Text>
            
            <Row style={styles.tableHeader}>
              <Column style={{ width: '40%' }}>
                <Text style={styles.tableHeaderText}>Item</Text>
              </Column>
              <Column style={{ width: '30%' }}>
                <Text style={styles.tableHeaderText}>SKU</Text>
              </Column>
              <Column style={{ width: '30%', textAlign: 'right' }}>
                <Text style={styles.tableHeaderText}>Qty</Text>
              </Column>
            </Row>


            {items.map((item, index) => (
              <Row key={index} style={styles.tableRow}>
                <Column style={{ width: '40%' }}>
                  <Text style={styles.tableText}>{item.title}</Text>
                  <Text style={styles.tableTextSmall}>{item.variant}</Text>
                </Column>
                <Column style={{ width: '30%' }}>
                  <Text style={styles.tableText}>{item.sku}</Text>
                </Column>
                <Column style={{ width: '30%', textAlign: 'right' }}>
                  <Text style={styles.tableText}>{item.quantity}</Text>
                </Column>
              </Row>
            ))}
          </Section>


          <Hr style={styles.hr} />


          <Section style={styles.footer}>
            <Text style={styles.footerText}>Thank you for your order!</Text>
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
  footer: {
    textAlign: 'center' as const,
    marginTop: '30px',
  },
  footerText: {
    fontSize: '14px',
    color: '#666',
  },
};
