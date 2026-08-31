import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { updateApprovalsWorkflow } from "../../../../workflows/approval/workflows/update-approval";
import { ApprovalStatusType } from "../../../../modules/approval/types";
import type { AdminUpdateApprovalType } from "../validators";

/*
  POST /admin/approvals/:id — Cardinal decides an Approval directly.
  Same workflow as the store route; handled_by records the admin user.
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateApprovalType>,
  res: MedusaResponse
) => {
  const userId = req.auth_context.actor_id;
  const { id } = req.params;
  const { status } = req.validatedBody;

  try {
    const { result } = await updateApprovalsWorkflow(req.scope).run({
      input: {
        id,
        status: status as ApprovalStatusType,
        handled_by: userId,
      },
    });
    return res.json({ approval: result });
  } catch (error) {
    return res.status(400).json({
      code: "invalid_data",
      message: (error as Error).message,
    });
  }
};
