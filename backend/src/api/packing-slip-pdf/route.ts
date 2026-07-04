import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { render } from "@react-email/render";
import puppeteer from "puppeteer";
import PackingSlip from "../../modules/email-notifications/templates/packing-slip";


export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  
    
  const dummyOrder = {
    orderNumber: "1013",
    orderDate: new Date().toLocaleDateString(),
    customerName: "empirical foods, Inc. - SSC",
    clientPoNumber: "457223", // Added client PO number
    shippingAddress: {
      line1: "390 164th St.",
      city: "South Sioux City, NE",
      postal: "68776",
      country: "USA"
    },
    items: [
      
      { 
        title: "Butt Weld Reducing Tee", 
        variant: "316, 1in x 1/2in",
        sku: "7WRT6P-100050",
        quantity: 10, 
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
