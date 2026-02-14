import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { render } from "@react-email/render";
import puppeteer from "puppeteer";
import PackingSlip from "../../modules/email-notifications/templates/packing-slip";


export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  
    
  const dummyOrder = {
    orderNumber: "1005",
    orderDate: new Date().toLocaleDateString(),
    customerName: "empirical foods, Inc. - SSC",
    clientPoNumber: "442850", // Added client PO number
    shippingAddress: {
      line1: "390 164th Street",
      city: "South Sioux City, NE",
      postal: "68776",
      country: "USA"
    },
    items: [
      
            { 
        title: "Butt Weld 90deg Elbow", 
        variant:"304, 1in",
        sku: "2WC4P-100",
        quantity: 6, 
      },
      


    ]
  };


  // Render React Email to HTML
  const html = await render(PackingSlip(dummyOrder));


  // Convert HTML to PDF using Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    }
  });
  
  await browser.close();


  // Send PDF as download
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="packing-slip-${dummyOrder.orderNumber}.pdf"`);
  res.send(Buffer.from(pdfBuffer));
}
