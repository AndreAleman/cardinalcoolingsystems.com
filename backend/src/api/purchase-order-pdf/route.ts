import type { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { render } from "@react-email/render";
import puppeteer from "puppeteer";
import PurchaseOrder from "../../modules/email-notifications/templates/purchase-order";

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  
  // ============================================
  // EDIT THIS DATA FOR EACH PURCHASE ORDER
  // ============================================
  
  const poData = {
    poNumber: "PO-0003",
    poDate: "01/05/2026",
    
    vendorName: "Sanitube",
    vendorAddress: {
      line1: "180 Contractors Way,",
      city: "Lakeland, FL",
      postal: "33801",
      country: "USA"
    },
    
    shipTo: {
      name: "empirical foods, Inc. - SSC",
      line1: "110 S Jennie Barker Road",
      city: "Garden City, KS",
      postal: "67846",
      country: "USA"
    },
    
    items: [
      { 
        description: "Butt Weld Reducing Tee, 316T, 1in x 1/2in", 
        sku: "7WRT6P-100050",
        quantity: 1, 
        unitPrice: 20.27
      },
      { 
        description: "45deg Elbow BW Tube, 304T, 2 1/2in", 
        sku: "2WK4P-250",
        quantity: 4, 
        unitPrice: 6.83
      },
            { 
        description: "Butt Weld Eccentric Reducer, 304T, 4in x 2in", 
        sku: "32W4P-400200",
        quantity: 4, 
        unitPrice: 29.59
      },
            { 
        description: "90 deg Elbow BW Tube, 304T, 4in", 
        sku: "2WC4P-400",
        quantity: 5, 
        unitPrice: 20.52
      },
            { 
        description: "90 deg Elbow BW Tube, 304T, 2in", 
        sku: "2WC4P-200",
        quantity: 10, 
        unitPrice: 6.00
      },
            { 
        description: "90 deg Elbow BW Tube, 304T, 1in", 
        sku: "2WC4P-100",
        quantity: 4, 
        unitPrice: 3.10
      },

    ],
    
    
    notes: "Please ship via UPS Ground. Contact us upon receipt."
  };

  // ============================================
  // GENERATE PDF (don't edit below)
  // ============================================

  const html = await render(PurchaseOrder(poData));

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

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="purchase-order-${poData.poNumber}.pdf"`);
  res.send(Buffer.from(pdfBuffer));
}
