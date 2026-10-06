import type { MedusaContainer } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils";
import { isTubeItem, isWholeSticks, TUBE_QUANTITY_MESSAGE } from "./tube-sticks";

/*
  Server-side guard for 20 ft tube sticks (utils/tube-sticks.ts), called
  from the cart hooks (add to cart, update line quantity, create cart).
  The storefronts round tube quantities up before they call the API, so a
  buyer only meets this error if something skips the storefront.
*/

type GuardLine = { variant_id?: string | null; quantity?: unknown };

export async function assertTubeQuantitiesAreSticks(
  container: MedusaContainer,
  lines: GuardLine[]
): Promise<void> {
  const withVariant = lines.filter((l) => !!l.variant_id);
  if (!withVariant.length) return;

  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "sku", "metadata", "product.handle", "product.metadata"],
    filters: { id: [...new Set(withVariant.map((l) => l.variant_id as string))] },
  });
  const byId = new Map((variants as any[]).map((v) => [v.id, v]));

  for (const line of withVariant) {
    const v = byId.get(line.variant_id as string);
    if (!v) continue;
    const tube = isTubeItem({
      sku: v.sku,
      metadata: v.metadata,
      productHandle: v.product?.handle,
      productMetadata: v.product?.metadata,
    });
    const quantity = Number(line.quantity);
    if (tube && !isWholeSticks(quantity)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${TUBE_QUANTITY_MESSAGE} ${v.sku ?? "Tube"}: ${quantity} ft requested.`
      );
    }
  }
}
