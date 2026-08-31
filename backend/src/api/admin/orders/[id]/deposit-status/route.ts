import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { updateDepositStatusWorkflow } from "../../../../../workflows/order/update-deposit-status";
import type { AdminSetOrderDepositStatusType } from "../../validators";

/*
  POST /admin/orders/:id/deposit-status — admin marks where a
  deposit_50 order is in the manual Stripe-invoice flow
  (deposit_invoiced → balance_invoiced → paid).
*/
export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSetOrderDepositStatusType>,
  res: MedusaResponse
) => {
  const { id } = req.params;

  await updateDepositStatusWorkflow(req.scope).run({
    input: { order_id: id, status: req.validatedBody.status },
  });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const {
    data: [order],
  } = await query.graph(
    {
      entity: "order",
      fields: ["id", "metadata"],
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ order });
};
