import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import {
  decidePayment,
  totalOrderWeightLbs,
} from "../../../utils/payment-rules";

/*
  The deposit path exists only for orders the money rules actually send
  there (over 120 lbs AND $7,500+, non-invoice Company). Recomputing the
  decision server-side keeps a tampered client from skipping payment.
*/

type Input = {
  cart_id: string;
  company_id: string;
};

export const validateDepositEligibilityStep = createStep(
  "validate-deposit-eligibility",
  async ({ cart_id, company_id }: Input, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);

    const {
      data: [cart],
    } = await query.graph(
      {
        entity: "cart",
        fields: [
          "id",
          "total",
          "items.quantity",
          "items.unit_price",
          "items.variant_id",
        ],
        filters: { id: cart_id },
      },
      { throwIfKeyNotFound: true }
    );

    const items = ((cart as any)?.items ?? []) as {
      quantity: number;
      unit_price: number | null;
      variant_id: string | null;
    }[];
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

    const { data: companies } = await query.graph({
      entity: "company",
      fields: ["id", "invoice_payment_enabled"],
      filters: { id: company_id },
    });

    const decision = decidePayment({
      totalUsd: Number((cart as any)?.total ?? 0),
      totalWeightLbs: totalOrderWeightLbs(
        items.map((item) => ({
          weightLbs: item.variant_id
            ? weightByVariant.get(item.variant_id) ?? null
            : null,
          quantity: Number(item.quantity ?? 0),
        }))
      ),
      hasQuoteOnlyLine: items.some(
        (item) => !item.unit_price || Number(item.unit_price) <= 0
      ),
      invoiceEnabled: Boolean(companies?.[0]?.invoice_payment_enabled),
    });

    if (decision !== "deposit_50") {
      const path =
        decision === "invoice"
          ? "this Company pays by invoice — use the invoice order path"
          : decision === "pay_in_full"
            ? "this order is paid in full at checkout"
            : "this order must be sent as a quote";
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `This cart does not qualify for a 50% deposit order: ${path}.`
      );
    }

    return new StepResponse({ decision });
  }
);
