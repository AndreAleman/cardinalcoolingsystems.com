import type { MedusaResponse } from "@medusajs/framework";
import type { CompanyRequest } from "../../../middlewares/ensure-company-approved";
import { FAVORITE_MODULE } from "../../../../modules/favorite";
import type FavoriteModuleService from "../../../../modules/favorite/service";
import { createFavoriteWorkflow } from "../../../../workflows/favorite/toggle-favorite";
import type { StoreFavoriteType } from "./validators";

/* GET /store/dashboard/favorites — the signed-in person's starred parts. */
export const GET = async (req: CompanyRequest, res: MedusaResponse) => {
  const favoriteModule = req.scope.resolve<FavoriteModuleService>(
    FAVORITE_MODULE
  );
  const favorites = await favoriteModule.listFavorites(
    { customer_id: req.auth_context.actor_id },
    { order: { created_at: "DESC" } }
  );
  res.json({ favorites });
};

/* POST /store/dashboard/favorites — star a part (idempotent). */
export const POST = async (
  req: CompanyRequest & { validatedBody: StoreFavoriteType },
  res: MedusaResponse
) => {
  const { result } = await createFavoriteWorkflow(req.scope).run({
    input: {
      customer_id: req.auth_context.actor_id,
      variant_id: req.validatedBody.variant_id,
    },
  });
  res.json({ favorite: result });
};
