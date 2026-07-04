import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { render } from "@react-email/render"
import puppeteer, { type Browser } from "puppeteer"
import PackingSlip from "../../modules/email-notifications/templates/packing-slip"
import PurchaseOrder from "../../modules/email-notifications/templates/purchase-order"
import type { CreateOrderDocumentsSchema } from "../../api/admin/order-documents/validators"
import { INVOICE_TERMS } from "../../lib/order-documents-defaults"

type Input = CreateOrderDocumentsSchema

function today(): string {
  return new Date().toLocaleDateString("en-US")
}

// The PDF templates render a single "city, postal" line, so fold state into city.
function cityLine(city: string, state?: string): string {
  return state ? `${city}, ${state}` : city
}

async function htmlToPdf(browser: Browser, html: string): Promise<Buffer> {
  const page = await browser.newPage()
  try {
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
    })
    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}

/**
 * Renders the packing slip (customer-facing) and the purchase order
 * (vendor-facing) from one input, reusing a single Puppeteer browser.
 * Returns base64 PDFs so the result is serializable through the workflow engine.
 */
export const renderOrderDocumentsStep = createStep(
  "render-order-documents",
  async (input: Input) => {
    const orderDate = input.orderDate || today()
    const poNumber = input.poNumber || `PO-${input.orderNumber}`
    const poDate = input.poDate || today()
    const customerCity = cityLine(input.customer.address.city, input.customer.address.state)

    // Packing slip — no prices; goes in the box to the customer.
    const packingSlipHtml = await render(
      PackingSlip({
        orderNumber: input.orderNumber,
        orderDate,
        customerName: input.customer.name,
        clientPoNumber: input.clientPoNumber || undefined,
        shippingAddress: {
          line1: input.customer.address.line1,
          line2: input.customer.address.line2 || undefined,
          city: customerCity,
          postal: input.customer.address.postal,
          country: "USA",
        },
        items: input.items.map((i) => ({
          title: i.description,
          variant: i.spec || "",
          quantity: i.quantity,
          sku: i.sku || "",
        })),
      })
    )

    // Purchase order — vendor cost; goes to the supplier (Sanitube).
    const purchaseOrderHtml = await render(
      PurchaseOrder({
        poNumber,
        poDate,
        vendorName: input.vendor.name,
        vendorAddress: {
          line1: input.vendor.address.line1,
          line2: input.vendor.address.line2 || undefined,
          city: input.vendor.address.city,
          postal: input.vendor.address.postal,
          country: "USA",
        },
        shipTo: {
          name: input.customer.name,
          line1: input.customer.address.line1,
          line2: input.customer.address.line2 || undefined,
          city: customerCity,
          postal: input.customer.address.postal,
          country: "USA",
        },
        items: input.items.map((i) => ({
          description: i.spec ? `${i.description}, ${i.spec}` : i.description,
          quantity: i.quantity,
          unitPrice: i.unitCost,
          sku: i.sku || undefined,
        })),
        terms: INVOICE_TERMS,
        notes: input.notes || undefined,
      })
    )

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    })
    try {
      const packingSlipPdf = await htmlToPdf(browser, packingSlipHtml)
      const purchaseOrderPdf = await htmlToPdf(browser, purchaseOrderHtml)

      return new StepResponse({
        packingSlipPdfBase64: packingSlipPdf.toString("base64"),
        purchaseOrderPdfBase64: purchaseOrderPdf.toString("base64"),
        poNumber,
      })
    } finally {
      await browser.close()
    }
  }
)
