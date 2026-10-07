import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils";
import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { addToCartWorkflow } from "@medusajs/medusa/core-flows";
import { getCartApprovalStatus } from "../../utils/get-cart-approval-status";
import { assertTubeQuantitiesAreSticks } from "../../utils/tube-quantity-guard";

/* Freeze held carts: no line-item adds while an Approval is pending.
   Tube lines must be whole 20 ft sticks (utils/tube-sticks.ts). */
addToCartWorkflow.hooks.validate(async ({ input, cart }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY);

  const {
    data: [queryCart],
  } = await query.graph({
    entity: "cart",
    fields: ["id", "approvals.*"],
    filters: { id: cart.id },
  });

  const { isPendingApproval } = getCartApprovalStatus(queryCart);

  if (isPendingApproval) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Cart is pending approval"
    );
  }

  await assertTubeQuantitiesAreSticks(container, (input.items ?? []) as any[]);

  return new StepResponse(undefined, null);
});
