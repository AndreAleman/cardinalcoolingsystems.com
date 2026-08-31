import type { MedusaResponse } from "@medusajs/framework";
import type { CompanyRequest } from "../../../../middlewares/ensure-company-approved";
import { removeFavoriteWorkflow } from "../../../../../workflows/favorite/toggle-favorite";

/* DELETE /store/dashboard/favorites/:variantId — unstar a part. */
export const DELETE = async (req: CompanyRequest, res: MedusaResponse) => {
  const { result } = await removeFavoriteWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      variant_id: req.params.variantId,
    },
  });
  res.json({ removed: result.removed });
};
