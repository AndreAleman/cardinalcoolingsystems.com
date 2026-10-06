import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { createCartWorkflow } from "@medusajs/medusa/core-flows";
import { assertTubeQuantitiesAreSticks } from "../../utils/tube-quantity-guard";

/* Carts created with items (the Dashboard's pay path builds one per
   submission): tube lines must be whole 20 ft sticks (utils/tube-sticks.ts). */
createCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  await assertTubeQuantitiesAreSticks(container, ((input as any).items ?? []) as any[]);
  return new StepResponse(undefined, null);
});
