import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { render } from "@react-email/render";
import PackingSlip from "../../modules/email-notifications/templates/packing-slip";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  
  const dummyOrder = {
    orderNumber: "1001",
    orderDate: new Date().toLocaleDateString(),
    customerName: "Test Customer",
    shippingAddress: {
      line1: "123 Test Street",
      city: "Test City",
      postal: "12345",
      country: "USA"
    },
    items: [
      { title: "Test Product 1", variant: "Medium", quantity: 2, sku: "TEST-001" },
      { title: "Test Product 2", variant: "Large", quantity: 1, sku: "TEST-002" },
    ]
  };

  const html = await render(PackingSlip(dummyOrder));

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}
