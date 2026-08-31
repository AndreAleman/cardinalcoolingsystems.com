import type { MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";

/*
  GET /store/dashboard/orders — the Company's Orders, newest first.
  Feeds the Orders section and Order Again. Every role sees the whole
  Company's orders today (all Team Members are admins); member-only
  scoping arrives when roles are switched on.
*/
export const GET = async (req: CompanyRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: [
      "id",
      "orders.id",
      "orders.display_id",
      "orders.status",
      "orders.total",
      "orders.currency_code",
      "orders.created_at",
      "orders.metadata",
      "orders.items.id",
      "orders.items.title",
      "orders.items.quantity",
      "orders.items.variant_sku",
      "orders.items.variant_id",
      "orders.items.unit_price",
    ],
    filters: { id: req.company_context.companyId },
  });

  const orders = (((company as any)?.orders ?? []) as any[])
    // Draft orders are unaccepted quotes — not Orders yet.
    .filter((order) => order && order.status !== "draft")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  res.json({ orders });
};
