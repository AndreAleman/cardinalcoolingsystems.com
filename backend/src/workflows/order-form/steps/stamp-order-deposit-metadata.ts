import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";
import { freightAllowance } from "../../../utils/payment-rules";

/*
  Mark a freshly promoted Order as a 50%-deposit order. Admin reads
  these fields to send the Stripe deposit invoice and, after arrival,
  the balance invoice (net 30) — with freight added at carrier cost
  unless `freight` is "allowed" (ADR-0009). Compensation restores prior
  metadata.
*/

type Input = {
  order_id: string;
};

type CompensationData = {
  order_id: string;
  previousMetadata: Record<string, unknown>;
};

export const stampOrderDepositMetadataStep = createStep(
  "stamp-order-deposit-metadata",
  async ({ order_id }: Input, { container }) => {
    const orderModule = container.resolve(Modules.ORDER);
    const order = await orderModule.retrieveOrder(order_id, {
      relations: ["shipping_address"],
    });
    const previousMetadata = (order.metadata ?? {}) as Record<string, unknown>;
    const shippingState = order.shipping_address?.province ?? null;
    const freight = freightAllowance({
      totalUsd: Number(order.total ?? 0),
      shippingState,
    });

    await orderModule.updateOrders([
      {
        id: order_id,
        metadata: {
          ...previousMetadata,
          payment_rule: "deposit_50",
          deposit_status: "due",
          freight,
          freight_ship_to_state: shippingState?.toUpperCase() ?? null,
        },
      },
    ]);

    return new StepResponse<{ order_id: string }, CompensationData>(
      { order_id },
      { order_id, previousMetadata }
    );
  },
  async (compensationData, { container }) => {
    if (!compensationData) return;
    const orderModule = container.resolve(Modules.ORDER);
    await orderModule.updateOrders([
      {
        id: compensationData.order_id,
        metadata: compensationData.previousMetadata,
      },
    ]);
  }
);
