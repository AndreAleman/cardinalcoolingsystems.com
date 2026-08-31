import { useRemoteQueryStep } from "@medusajs/medusa/core-flows";
import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { updateOrderStep } from "../steps/update-order";

export type UpdateOrderWorkflowInput = {
  id: string;
  is_draft_order: boolean;
  status: string;
  metadata?: Record<string, unknown>;
};

/*
  Update an order's draft flag / status / metadata. The quote workflows
  use this to convert a draft order into an active order. Named with a
  b2b- prefix so its id never collides with core's updateOrderWorkflow.

  Explicit generics: inferred workflow types are not portable under pnpm
  and break `medusa build` declaration emit (see commit 98fb1a1).
*/
export const updateOrderWorkflow = createWorkflow<
  UpdateOrderWorkflowInput,
  void,
  []
>("b2b-update-order-workflow", function (input: UpdateOrderWorkflowInput) {
  useRemoteQueryStep({
    entry_point: "order",
    fields: ["id"],
    variables: { id: input.id },
    list: false,
    throw_if_key_not_found: true,
  });

  updateOrderStep(input);

  return new WorkflowResponse(void 0);
});
