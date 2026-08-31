import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { completeCartWorkflow } from "@medusajs/medusa/core-flows";
import { getCartApprovalStatus } from "../../utils/get-cart-approval-status";
import { checkSpendingLimit } from "../../utils/check-spending-limit";
import {
  decidePayment,
  totalOrderWeightLbs,
} from "../../utils/payment-rules";

/*
  Gate cart completion:
  1. a held cart (pending Approval) never completes;
  2. the freight rules apply to everyone — over 120 lbs (or unknown
     weight) can't be paid at checkout; heavy $7,500+ orders take the
     deposit path from the dashboard, not the card screen;
  3. a Team Member with a spending limit can't complete a cart that
     would push their windowed spend over it. Inert today — every
     Employee.spending_limit defaults to 0 (= no limit).
*/
completeCartWorkflow.hooks.validate(async ({ cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [queryCart],
  } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "approvals.*",
      "customer_id",
      "total",
      "items.quantity",
      "items.unit_price",
      "items.variant_id",
    ],
    filters: { id: cart.id },
  });

  const { isPendingApproval } = getCartApprovalStatus(queryCart);

  if (isPendingApproval) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cart is pending approval"
    );
  }

  const items = ((queryCart as any)?.items ?? []) as {
    quantity: number;
    unit_price: number | null;
    variant_id: string | null;
  }[];

  if (items.length > 0) {
    const variantIds = items
      .map((item) => item.variant_id)
      .filter((id): id is string => Boolean(id));
    const { data: variants } = await query.graph({
      entity: "variant",
      fields: ["id", "weight"],
      filters: { id: variantIds },
    });
    const weightByVariant = new Map(
      (variants as { id: string; weight: number | null }[]).map((variant) => [
        variant.id,
        variant.weight,
      ])
    );

    const totalWeightLbs = totalOrderWeightLbs(
      items.map((item) => ({
        weightLbs: item.variant_id
          ? weightByVariant.get(item.variant_id) ?? null
          : null,
        quantity: Number(item.quantity ?? 0),
      }))
    );
    const hasQuoteOnlyLine = items.some(
      (item) => !item.unit_price || Number(item.unit_price) <= 0
    );

    const decision = decidePayment({
      totalUsd: Number((queryCart as any)?.total ?? 0),
      totalWeightLbs,
      hasQuoteOnlyLine,
      invoiceEnabled: false, // invoice Companies order from the dashboard, not checkout
    });

    if (decision === "quote_required" || decision === "deposit_50") {
      const message =
        totalWeightLbs === null || hasQuoteOnlyLine
          ? "This cart includes parts that must be quoted (missing weight or price on file). Please request a quote instead of checking out."
          : decision === "deposit_50"
            ? "Orders over 120 lbs at $7,500+ are paid by 50% deposit — submit this order from your company dashboard instead of checkout, or request a freight quote."
            : "This order is over 120 lbs, so freight must be quoted before it ships. Please request a freight quote instead of checking out.";
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, message);
    }
  }

  if (queryCart?.customer_id) {
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: [
        "id",
        "employee.spending_limit",
        "employee.company.spending_limit_reset_frequency",
      ],
      filters: { id: queryCart.customer_id },
    });

    const spendingLimit = Number(
      (customer as any)?.employee?.spending_limit ?? 0
    );

    if (spendingLimit > 0) {
      const { data: orders } = await query.graph({
        entity: "order",
        fields: ["id", "total", "created_at"],
        filters: { customer_id: queryCart.customer_id } as any,
      });

      const spendLimitExceeded = checkSpendingLimit(queryCart as any, {
        ...(customer as any),
        orders: orders as any[],
      });

      if (spendLimitExceeded) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          "Cart total exceeds spending limit"
        );
      }
    }
  }

  return new StepResponse(undefined, null);
});
