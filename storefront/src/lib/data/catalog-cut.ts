import "server-only"

import { sdk } from "@lib/config"
import { buildCatalogCut, catalogCutTerms, type CutGroup, type CutProduct } from "@lib/builder/catalog-cut"
import { getRegion } from "./regions"

/*
  The data-center catalog cut at posted (list) prices for the per-account pages (B15). Searches
  the store for each family's term and keeps only the variants whose SKU matches a family
  pattern (lib/builder/catalog-cut.ts), so it lists whatever really exists. Cached for an hour;
  a failed search drops that family instead of failing the page.
*/
export async function getCatalogCut(countryCode: string): Promise<CutGroup[]> {
  const region = await getRegion(countryCode).catch(() => null)
  if (!region) return []
  const results = await Promise.all(
    catalogCutTerms().map((q) =>
      sdk.store.product
        .list(
          { q, limit: 100, region_id: region.id, fields: "id,handle,title,*variants,*variants.calculated_price" },
          { next: { tags: ["products"], revalidate: 3600 } } as any
        )
        .then(({ products }) => products as unknown as CutProduct[])
        .catch(() => [] as CutProduct[])
    )
  )
  return buildCatalogCut(results.flat())
}
