import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { render } from "@react-email/render";
import puppeteer from "puppeteer";
import PackingSlip from "../../modules/email-notifications/templates/packing-slip";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  
    
  const dummyOrder = {
    orderNumber: "1003",
    orderDate: new Date().toLocaleDateString(),
    customerName: "empirical foods, Inc. - SSC",
    shippingAddress: {
      line1: "6001 Dakota Ave",
      city: "South Sioux City, NE",
      postal: "68776",
      country: "USA"
    },
    items: [
      
            { 
        title: "Butt Weld Reducing Tee", 
        variant:"316T, 1in x 1/2in",
        sku: "7WRT6P-100050",
        quantity: 1, 
      },
      { 
        title: "45deg Elbow BW Tube", 
        variant: "304T, 2 1/2in",
        sku: "2WK4P-250",
        quantity: 4, 
      },
            { 
        title: "Butt Weld Eccentric Reducer", 
        variant: "304T, 4in x 2in",
        sku: "32W4P-400200",
        quantity: 4, 
      },
            { 
        title: "90 deg Elbow BW Tube", 
        variant: "316T, 4in",
        sku: "2WC6P-400",
        quantity: 5, 
      },
            { 
        title: "90 deg Elbow BW Tube", 
        variant: "304T, 2in",
        sku: "2WC4P-200",
        quantity: 10,
      },
            { 
        title: "90 deg Elbow BW Tube", 
        variant: "304T, 1in",
        sku: "2WC4P-100",
        quantity: 4, 
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
