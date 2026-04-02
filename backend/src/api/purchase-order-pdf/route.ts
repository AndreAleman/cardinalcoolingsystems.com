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
    poNumber: "PO-0009",
    poDate: "03/9/2026",
    
    vendorName: "Sanitube",
    vendorAddress: {
      line1: "180 Contractors Way,",
      city: "Lakeland, FL",
      postal: "33801",
      country: "USA"
    },
    
    shipTo: {
      name: "empirical foods, Inc. - SSC",
      line1: "6001 Dakota Ave",
      city: "South Sioux City, NE",
      postal: "68776",
      country: "USA"
    },
    
    items: [
      { 
        description: "Concentric Reducer, 304 Stainless Steel, 2in x 1-1/2in", 
        sku: "31W4P-200150",
        quantity: 4, 
        unitPrice: 6.20
      },
      
    ],
    
    
    notes: "Please ship via UPS 2 Day Air. Contact us upon receipt."
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
