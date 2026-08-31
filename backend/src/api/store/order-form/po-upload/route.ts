import type { MedusaResponse } from "@medusajs/framework";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { readPoUploadWorkflow } from "../../../../workflows/order-form/workflows/read-po-upload";
import type { PoUploadType } from "../validators";

/*
  POST /store/order-form/po-upload

  A Team Member drops their purchase-order document; the AI reads it
  and the response is the PO Read-Out for them to check on the
  Dashboard before paying or quoting. Nothing is ordered here.
*/
export const POST = async (
  req: CompanyRequest & { validatedBody: PoUploadType },
  res: MedusaResponse
) => {
  const { filename, mime_type, file_base64 } = req.validatedBody;

  const { result } = await readPoUploadWorkflow(req.scope).run({
    input: {
      filename,
      mime_type,
      file_base64,
      customer_id: req.auth_context.actor_id,
      company_id: req.company_context.companyId,
    },
  });

  return res.json(result);
};
