import type { MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { updateApprovalsWorkflow } from "../../../../workflows/approval/workflows/update-approval";
import { ApprovalStatusType } from "../../../../modules/approval/types";
import type { StoreUpdateApprovalType } from "../validators";

/*
  POST /store/approvals/:id — approve or reject a held submission.
  Behind dashboardGate + ensureEmployeeRole("admin", "manager"): members
  never decide. The Approval must belong to the requester's Company;
  handled_by is stamped with the deciding customer's id.
*/
export const POST = async (
  req: CompanyRequest & { validatedBody: StoreUpdateApprovalType },
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const customerId = req.auth_context.actor_id;
  const { id } = req.params;
  const { status } = req.validatedBody;

  const {
    data: [approval],
  } = await query.graph({
    entity: "approval",
    fields: ["id", "cart_id"],
    filters: { id },
  });

  if (!approval) {
    return res
      .status(404)
      .json({ code: "not_found", message: "Approval not found" });
  }

  // Company scoping: the approval's cart must be one of ours.
  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: ["id", "carts.id"],
    filters: { id: req.company_context.companyId },
  });
  const ownsCart = (((company as any)?.carts ?? []) as { id: string }[])
    .filter(Boolean)
    .some((cart) => cart.id === (approval as any).cart_id);

  if (!ownsCart) {
    return res
      .status(404)
      .json({ code: "not_found", message: "Approval not found" });
  }

  try {
    const { result } = await updateApprovalsWorkflow(req.scope).run({
      input: {
        id,
        status: status as ApprovalStatusType,
        handled_by: customerId,
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
