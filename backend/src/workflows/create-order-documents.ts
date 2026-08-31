import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import type { CreateOrderDocumentsSchema } from "../api/admin/order-documents/validators"
import { renderOrderDocumentsStep } from "./steps/render-order-documents"
import { createStripeInvoiceStep } from "./steps/create-stripe-invoice"

type Input = CreateOrderDocumentsSchema

/**
 * One input → three outputs: a packing-slip PDF (customer), a purchase-order PDF
 * (vendor cost), and a Stripe DRAFT invoice (client price) for you to review and
 * send from Stripe. PDF rendering and invoice creation are independent; the
 * invoice step rolls back (deletes the draft) if the flow fails.
 */
export const createOrderDocumentsWorkflow = createWorkflow(
  "create-order-documents",
  function (input: Input) {
    const documents = renderOrderDocumentsStep(input)
    const invoice = createStripeInvoiceStep(input)

    const result = transform({ documents, invoice }, (data) => ({
      packingSlipPdfBase64: data.documents.packingSlipPdfBase64,
      purchaseOrderPdfBase64: data.documents.purchaseOrderPdfBase64,
      poNumber: data.documents.poNumber,
      invoice: data.invoice,
    }))

    return new WorkflowResponse(result)
  }
)

export default createOrderDocumentsWorkflow
