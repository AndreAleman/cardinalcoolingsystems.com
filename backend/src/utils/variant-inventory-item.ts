/*
  The inventory item already linked to a variant, if any.

  The QuickBooks inventory webhooks match rows by variant SKU. When a SKU
  is renamed (e.g. AI270P-4100 -> A270P-4100, Oct 2026), the linked
  inventory item may still carry the old SKU, so looking the item up by
  SKU alone would create a second item and link it to the same variant
  (Medusa then treats the variant as a two-part kit). Prefer the linked
  item; fall back to the SKU lookup only when nothing is linked.
*/
type Query = {
  graph: (config: any) => Promise<{ data: any[] }>;
};

export async function linkedInventoryItemId(
  query: Query,
  variantId: string
): Promise<string | null> {
  const { data } = await query.graph({
    entity: "variant",
    fields: ["id", "inventory_items.inventory_item_id"],
    filters: { id: variantId },
  });
  const links = (data?.[0]?.inventory_items ?? []) as Array<{ inventory_item_id?: string }>;
  return links.find((l) => l?.inventory_item_id)?.inventory_item_id ?? null;
}
