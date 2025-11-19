import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { Resend } from "resend";
import { render } from "@react-email/render";
import puppeteer from "puppeteer";
import PackingSlip from "../../modules/email-notifications/templates/packing-slip";

export async function POST(
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
    ]
  };

  const html = await render(PackingSlip(dummyOrder));

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();

  // Convert Uint8Array to Buffer
  const buffer = Buffer.from(pdfBuffer);

  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'orders@yourdomain.com',
    to: 'customer@example.com',
    subject: 'Your Packing Slip',
    text: 'Please find your packing slip attached.',
    attachments: [
      {
        filename: `packing-slip-${dummyOrder.orderNumber}.pdf`,
        content: buffer,
      }
    ]
  });

  res.status(200).json({ message: "Packing slip sent!" });
}
