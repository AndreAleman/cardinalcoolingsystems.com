import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  removeTeamMemberWorkflow,
  updateTeamMemberWorkflow,
} from "../../../../../../workflows/company/manage-team-member";
import { AdminUpdateTeamMemberType } from "../../../validators";

/* POST — change Role / Spending Limit. DELETE — remove from the Company. */
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateTeamMemberType>,
  res: MedusaResponse
) => {
  const { result } = await updateTeamMemberWorkflow(req.scope).run({
    input: {
      company_id: req.params.id,
      employee_id: req.params.teamMemberId,
      ...req.validatedBody,
    },
  });
  res.json({ team_member: result });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await removeTeamMemberWorkflow(req.scope).run({
    input: { company_id: req.params.id, employee_id: req.params.teamMemberId },
  });
  res.json({ id: req.params.teamMemberId, object: "team_member", deleted: true });
};
