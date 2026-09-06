import type { MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { resolveTeamMemberLocationId } from "../../../../utils/company-context";

/*
  GET /store/dashboard/orders — the Company's Orders, newest first.
  Feeds the Orders section and Order Again. Visibility by Role:

    member                    -> only orders they submitted
    manager with a Location   -> orders tagged with that Location
    manager with no Location  -> the whole Company (role fallback)
    admin                     -> everything

  Submitter attribution is order.customer_id; the Location tag is
  order.metadata.location_id, stamped at submit time from the buyer's
  Ship-to pick. (Quotes stay company-wide — this scoping is orders only.)
*/
export const GET = async (req: CompanyRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { role } = req.company_context;
  const customerId = req.auth_context.actor_id;

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
      "orders.customer_id",
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

  let visible = (((company as any)?.orders ?? []) as any[])
    // Draft orders are unaccepted quotes — not Orders yet.
    .filter((order) => order && order.status !== "draft");

  if (role === "member") {
    visible = visible.filter((order) => order.customer_id === customerId);
  } else if (role === "manager") {
    const locationId = await resolveTeamMemberLocationId(
      req.scope,
      customerId
    );
    if (locationId) {
      visible = visible.filter(
        (order) => (order.metadata as any)?.location_id === locationId
      );
    }
    // No home site: the manager sees the whole Company.
  }
  // admin: everything.

  const orders = visible.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  res.json({ orders });
};
