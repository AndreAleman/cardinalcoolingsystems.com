import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" style={{ borderRadius: "5px" }} />
  }

  return (
    <div className="flex flex-col gap-y-1">
      {/* Label */}
      <p className="text-xs font-medium" style={{ color: "#9ca3af" }}>
        {!variant ? "Starting at" : "Price"}
      </p>

      {/* Price */}
      <div className="flex items-baseline gap-x-3">
        <span
          className="text-4xl font-semibold tracking-tight"
          style={{ color: selectedPrice.price_type === "sale" ? "#E3000F" : "#111111" }}
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>

        {selectedPrice.price_type === "sale" && (
          <span
            className="text-base line-through"
            style={{ color: "#9ca3af" }}
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
        )}

        {selectedPrice.price_type === "sale" && (
          <span
            className="text-sm font-medium px-2 py-0.5"
            style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
          >
            -{selectedPrice.percentage_diff}%
          </span>
        )}
      </div>

      {/* Subtitle */}
      <p className="text-xs font-light" style={{ color: "#9ca3af" }}>
        {!variant
          ? "Final price depends on selected options"
          : "Price for selected configuration"}
      </p>
    </div>
  )
}
