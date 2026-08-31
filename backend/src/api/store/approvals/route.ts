import type { MedusaResponse } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import type { CompanyRequest } from "../../middlewares/ensure-company-approved";

/*
  GET /store/approvals — the Dashboard approval queue, scoped by Role:
  admins and managers see every Approval in their Company; members see
  only the ones they submitted (created_by is set authoritatively from
  the workflow input). Behind dashboardGate.
*/
export const GET = async (req: CompanyRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { companyId, role } = req.company_context;
  const customerId = req.auth_context.actor_id;

  // Held carts are linked to the Company by createApprovalsWorkflow, so
  // company.carts is exactly the set of carts that can carry Approvals.
  const {
    data: [company],
  } = await query.graph({
    entity: "company",
    fields: ["id", "carts.id"],
    filters: { id: companyId },
  });

  const cartIds = (((company as any)?.carts ?? []) as { id: string }[])
    .filter(Boolean)
    .map((cart) => cart.id);

  if (!cartIds.length) {
    return res.json({ approvals: [], count: 0 });
  }

  const filters: Record<string, unknown> = { cart_id: cartIds };
  if (role === "member") {
    filters.created_by = customerId;
  }

  const { data: approvals } = await query.graph({
    entity: "approval",
    fields: ["*"],
    filters: filters as any,
  });

  // Enrich with what is being approved and by whom, so the queue rows
  // are readable without extra round-trips.
  const approvalCartIds = [
    ...new Set(approvals.map((approval: any) => approval.cart_id)),
  ];
  const submitterIds = [
    ...new Set(approvals.map((approval: any) => approval.created_by)),
  ];

  const [{ data: carts }, { data: submitters }] = await Promise.all([
    query.graph({
      entity: "cart",
      fields: [
        "id",
        "total",
        "currency_code",
        "metadata",
        "items.title",
        "items.quantity",
        "items.variant_sku",
      ],
      filters: { id: approvalCartIds },
    }),
    query.graph({
      entity: "customer",
      fields: ["id", "email", "first_name", "last_name"],
      filters: { id: submitterIds },
    }),
  ]);

  const cartById = new Map((carts as any[]).map((cart) => [cart.id, cart]));
  const submitterById = new Map(
    (submitters as any[]).map((customer) => [customer.id, customer])
  );

  const enriched = approvals.map((approval: any) => {
    const cart = cartById.get(approval.cart_id);
    const submitter = submitterById.get(approval.created_by);
    return {
      ...approval,
      cart: cart
        ? {
            id: cart.id,
            total: cart.total,
            currency_code: cart.currency_code,
            po_number: (cart.metadata as any)?.po_number ?? null,
            request_type: (cart.metadata as any)?.request_type ?? null,
            items: (cart.items ?? []).map((item: any) => ({
              title: item.title,
              quantity: item.quantity,
              variant_sku: item.variant_sku,
            })),
          }
        : null,
      submitter: submitter
        ? {
            id: submitter.id,
            email: submitter.email,
            name:
              [submitter.first_name, submitter.last_name]
                .filter(Boolean)
                .join(" ") || submitter.email,
          }
        : null,
    };
  });

  res.json({ approvals: enriched, count: enriched.length });
};
