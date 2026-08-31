import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { createOrderDocumentsWorkflow } from "../../../workflows/create-order-documents"
import { CreateOrderDocumentsSchema } from "./validators"

// Generates a packing slip + purchase order PDF and a Stripe invoice from one
// payload. Lives under /admin so it inherits admin authentication.
export async function POST(
  req: AuthenticatedMedusaRequest<CreateOrderDocumentsSchema>,
  res: MedusaResponse
): Promise<void> {
  try {
    const { result } = await createOrderDocumentsWorkflow(req.scope).run({
      input: req.validatedBody,
    })
    res.json(result)
  } catch (error) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      error instanceof Error ? error.message : "Failed to create order documents"
    )
  }
}
