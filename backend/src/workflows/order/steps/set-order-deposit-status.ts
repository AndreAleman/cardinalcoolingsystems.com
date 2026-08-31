import { MedusaError, Modules } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import type { DepositStatus } from "../update-deposit-status";

/*
  Move a 50%-deposit Order through its manual invoicing states. Only
  orders stamped payment_rule="deposit_50" (see order-form's
  stamp-order-deposit-metadata step) can transition; compensation
  restores the previous metadata.
*/
export const setOrderDepositStatusStep = createStep(
  "set-order-deposit-status",
  async (input: { order_id: string; status: DepositStatus }, { container }) => {
    const orderModule = container.resolve(Modules.ORDER);
    const order = await orderModule.retrieveOrder(input.order_id);
    const previousMetadata = (order.metadata ?? {}) as Record<string, unknown>;

    if (previousMetadata.payment_rule !== "deposit_50") {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Only 50%-deposit orders have a deposit status"
      );
    }

    await orderModule.updateOrders([
      {
        id: input.order_id,
        metadata: { ...previousMetadata, deposit_status: input.status },
      },
    ]);

    return new StepResponse(
      { order_id: input.order_id, deposit_status: input.status },
      { order_id: input.order_id, previousMetadata }
    );
  },
  async (prev, { container }) => {
    if (!prev) return;
    const orderModule = container.resolve(Modules.ORDER);
    await orderModule.updateOrders([
      { id: prev.order_id, metadata: prev.previousMetadata },
    ]);
  }
);
