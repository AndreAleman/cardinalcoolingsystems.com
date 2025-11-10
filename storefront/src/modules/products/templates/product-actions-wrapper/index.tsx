import { getProductsById } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product and renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
  selectedVariant,  // ← ADDED
}: {
  id: string
  region: HttpTypes.StoreRegion
  selectedVariant?: HttpTypes.StoreProductVariant | null  // ← ADDED
}) {
  const [product] = await getProductsById({
    ids: [id],
    regionId: region.id,
  })

  if (!product) {
    return null
  }

  return (
    <ProductActions 
      product={product} 
      region={region}
      selectedVariant={selectedVariant}  // ← ADDED: Pass to ProductActions
    />
  )
}
