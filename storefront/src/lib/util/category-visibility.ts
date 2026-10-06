// Google Merchant Center rejects stores that link to empty categories or show
// placeholder images. These helpers decide which categories are visible
// (they, or a descendant, hold at least one published product) and pick a
// real product photo for a category card.
//
// They work on the flat list the Store API returns from
// `sdk.store.category.list()` (every category at the top level, each with
// `parent_category_id` and `products.id`), so callers must request those
// fields and a limit large enough to cover the whole tree.

type ProductImageLike = {
  id?: string
  thumbnail?: string | null
  images?: { url?: string | null; rank?: number | null }[] | null
}

export type CategoryLike = {
  id: string
  parent_category_id?: string | null
  metadata?: Record<string, unknown> | null
  products?: ProductImageLike[] | null
  category_children?: CategoryLike[] | null
}

/** Ids of categories that hold a published product themselves or in a descendant. */
export function nonEmptyCategoryIds(flat: CategoryLike[]): Set<string> {
  const byId = new Map(flat.map((c) => [c.id, c]))
  const visible = new Set<string>()

  for (const category of flat) {
    if (!category.products?.length) continue
    // Mark the category and every ancestor as visible.
    let current: CategoryLike | undefined = category
    while (current && !visible.has(current.id)) {
      visible.add(current.id)
      current = current.parent_category_id
        ? byId.get(current.parent_category_id)
        : undefined
    }
  }

  return visible
}

/** Drops empty categories, recursing into `category_children`. */
export function pruneEmptyCategories<T extends { id: string }>(
  categories: T[],
  visibleIds: Set<string>
): T[] {
  return categories
    .filter((c) => visibleIds.has(c.id))
    .map((c) => {
      const children = (c as unknown as CategoryLike).category_children
      if (!children) return c
      return {
        ...c,
        category_children: pruneEmptyCategories(children, visibleIds),
      }
    })
}

export function productImage(product: ProductImageLike): string | null {
  if (product.thumbnail) return product.thumbnail
  const sorted = (product.images ?? [])
    .filter((i) => !!i?.url)
    .slice()
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  return sorted[0]?.url ?? null
}

/**
 * A real photo for a category card: the category's own image metadata, then
 * its first product photo, then the first product photo found in its
 * descendants (parent categories often hold no products themselves).
 * Returns null when no real photo exists; callers render no image rather
 * than a placeholder.
 */
export function categoryImage(
  category: CategoryLike,
  flat: CategoryLike[] = []
): string | null {
  const meta = category.metadata ?? {}
  if (typeof meta.image === "string" && meta.image) return meta.image
  if (typeof meta.featured_image === "string" && meta.featured_image) {
    return meta.featured_image
  }

  // Own products: from the card's object, then from the flat list's copy of
  // the same category (nested children often carry fewer product fields).
  const self = flat.find((c) => c.id === category.id)
  for (const p of [...(category.products ?? []), ...(self?.products ?? [])]) {
    const img = productImage(p)
    if (img) return img
  }

  // Descendants: use the flat list (it carries products for every level).
  const seen = new Set<string>([category.id])
  const queue = flat.filter((c) => c.parent_category_id === category.id)
  while (queue.length) {
    const next = queue.shift()!
    if (seen.has(next.id)) continue
    seen.add(next.id)
    for (const p of next.products ?? []) {
      const img = productImage(p)
      if (img) return img
    }
    queue.push(...flat.filter((c) => c.parent_category_id === next.id))
  }

  return null
}
