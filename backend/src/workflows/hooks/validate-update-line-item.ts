import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { updateLineItemInCartWorkflow } from "@medusajs/medusa/core-flows";
import { assertTubeQuantitiesAreSticks } from "../../utils/tube-quantity-guard";

/* Tube lines must stay whole 20 ft sticks when a cart quantity changes
   (utils/tube-sticks.ts). Quantity 0 removes the line, so it passes. */
updateLineItemInCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const quantity = Number((input as any).update?.quantity);
  if (!Number.isFinite(quantity) || quantity === 0) {
    return new StepResponse(undefined, null);
  }
  const item = ((cart as any)?.items ?? []).find((i: any) => i.id === (input as any).item_id);
  if (item?.variant_id) {
    await assertTubeQuantitiesAreSticks(container, [{ variant_id: item.variant_id, quantity }]);
  }
  return new StepResponse(undefined, null);
});
