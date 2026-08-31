import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { Modules } from "@medusajs/framework/utils";

/*
  Draft-order creation for carts made ENTIRELY of custom lines (quote
  carts: unpriced / over-stock parts). The core createOrdersWorkflow
  cannot take them — it price-validates and inventory-reserves
  variant-linked items, and crashes outright when no item has a
  variant_id (data.variants.find on undefined, core-flows 2.8.8). The
  order module accepts the lines as-is; the merchant prices them
  through the order edit.
*/

type Input = {
  order: Record<string, any>;
};

export const createCustomDraftOrderStep = createStep(
  "create-custom-draft-order",
  async ({ order }: Input, { container }) => {
    const orderModule = container.resolve(Modules.ORDER);
    const created = (await orderModule.createOrders(order as any)) as unknown as {
      id: string;
    };
    return new StepResponse(created, created.id);
  },
  async (orderId, { container }) => {
    if (!orderId) return;
    const orderModule = container.resolve(Modules.ORDER);
    await orderModule.deleteOrders([orderId]);
  }
);
