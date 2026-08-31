import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { AdminGetApprovalsType } from "./validators";

/*
  GET /admin/approvals — Cardinal's view of every Approval, optionally
  filtered by ?status=. Cart context rides along so admin can see what
  is being held.
*/
export const GET = async (
  req: AuthenticatedMedusaRequest & { validatedQuery?: AdminGetApprovalsType },
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const status = (req.validatedQuery ?? (req.query as any))?.status;
  const filters: Record<string, unknown> = {};
  if (status) {
    filters.status = status;
  }

  const { data: approvals } = await query.graph({
    entity: "approval",
    fields: ["*", "cart.id", "cart.total", "cart.items.*", "cart.company.*"],
    filters: filters as any,
  });

  res.json({ approvals, count: approvals.length });
};
