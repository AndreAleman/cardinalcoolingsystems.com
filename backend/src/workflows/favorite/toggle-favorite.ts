import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { FAVORITE_MODULE } from "../../modules/favorite";
import type FavoriteModuleService from "../../modules/favorite/service";

type FavoriteKey = {
  customer_id: string;
  variant_id: string;
};

/* Starring is idempotent: starring an already-starred part is a no-op. */
const createFavoriteStep = createStep(
  "create-favorite",
  async (input: FavoriteKey, { container }) => {
    const favoriteModule =
      container.resolve<FavoriteModuleService>(FAVORITE_MODULE);

    const [existing] = await favoriteModule.listFavorites(input);
    if (existing) {
      return new StepResponse(existing, null);
    }

    const created = await favoriteModule.createFavorites(input);
    return new StepResponse(created, created.id);
  },
  async (createdId, { container }) => {
    if (!createdId) return;
    const favoriteModule =
      container.resolve<FavoriteModuleService>(FAVORITE_MODULE);
    await favoriteModule.deleteFavorites(createdId);
  }
);

const removeFavoriteStep = createStep(
  "remove-favorite",
  async (input: FavoriteKey, { container }) => {
    const favoriteModule =
      container.resolve<FavoriteModuleService>(FAVORITE_MODULE);
    const [existing] = await favoriteModule.listFavorites(input);
    if (existing) {
      await favoriteModule.deleteFavorites(existing.id);
    }
    return new StepResponse({ removed: Boolean(existing) }, existing ?? null);
  },
  async (removed, { container }) => {
    if (!removed) return;
    const favoriteModule =
      container.resolve<FavoriteModuleService>(FAVORITE_MODULE);
    await favoriteModule.createFavorites({
      customer_id: removed.customer_id,
      variant_id: removed.variant_id,
    });
  }
);

export const createFavoriteWorkflow = createWorkflow<
  FavoriteKey,
  { id: string; customer_id: string; variant_id: string },
  []
>("create-favorite", function (input: FavoriteKey) {
  return new WorkflowResponse(createFavoriteStep(input));
});

export const removeFavoriteWorkflow = createWorkflow<
  FavoriteKey,
  { removed: boolean },
  []
>("remove-favorite", function (input: FavoriteKey) {
  return new WorkflowResponse(removeFavoriteStep(input));
});
