import { HttpTypes } from "@medusajs/types"

type Props = {
  categories: HttpTypes.StoreProductCategory[]
}

// Only these categories are shown, in this exact order.
// Pass the full list from sdk.store.category.list() — filtering happens here.
const HANDLES = [
  "butterfly-valves",
  "ball-valves",
  "tees",
  "90-clamp-elbows",
  "tube",
  "90-elbows",
  "adapters",
] as const

const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  "butterfly-valves":
    "Butterfly valves for precise flow control in sanitary and industrial piping systems.",
  "ball-valves":
    "Three-piece ball valves for industrial applications requiring reliable shut-off.",
  tees: "Sanitary tee fittings for splitting or combining flow in stainless steel pipework.",
  "90-clamp-elbows":
    "90° clamp elbows for tight-radius directional changes in sanitary tube systems.",
  tube: "Precision stainless steel tubing engineered for sanitary and industrial applications.",
  "90-elbows":
    "90° butt-weld elbows providing smooth directional changes in process pipework.",
  adapters:
    "Butt-weld adapters that transition from welded tube to other connection styles.",
}

// Pin a specific product image per category handle.
// The component will prefer this product's image over others in the category.
const PINNED_PRODUCT_IDS: Record<string, string> = {
  "butterfly-valves": "prod_01K5SVPJHZN3V6D1DV44BB0GSV",
}

export default function ProductCategories({ categories }: Props) {
  // Filter to only the handles we want, preserving the order defined in HANDLES
  const filtered = HANDLES.reduce<HttpTypes.StoreProductCategory[]>(
    (acc, handle) => {
      const match = categories.find((c) => c.handle === handle)
      if (match) acc.push(match)
      return acc
    },
    []
  )

  return (
    <section
      className="bg-white py-20"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <div className="max-w-screen-xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2
            className="text-[40px] font-bold mb-4 leading-tight"
            style={{ color: "#111111" }}
          >
            Product categories
          </h2>
          <p
            className="text-sm leading-relaxed max-w-[540px] mx-auto"
            style={{ color: "#555555" }}
          >
            Explore our complete range of sanitary stainless steel products.
            From precision-engineered tubing to industrial valves and fittings,
            find the perfect solution for your application.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {filtered.map((category) => {
            const description =
              category.description ||
              FALLBACK_DESCRIPTIONS[category.handle] ||
              "Explore our stainless steel product range."

            const productCount = category.products?.length ?? 0

            // Collect images from products — prefer thumbnail, fall back to images[0]
            type ProductWithImages = {
              id?: string
              thumbnail?: string | null
              images?: { url: string; rank?: number | null }[]
            }

            const getProductImage = (p: ProductWithImages): string | null => {
              if (p.thumbnail) return p.thumbnail
              const sorted = (p.images ?? [])
                .slice()
                .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
              return sorted[0]?.url ?? null
            }

            const products = (category.products ?? []) as ProductWithImages[]

            // If a pinned product ID exists for this category, use that product's image first
            const pinnedId = PINNED_PRODUCT_IDS[category.handle]
            const pinnedImage = pinnedId
              ? getProductImage(products.find((p) => p.id === pinnedId) ?? {})
              : null

            const productImages = products
              .map(getProductImage)
              .filter((t): t is string => !!t)

            // Prefer pinned → then pick deterministically by handle length
            const thumbnail =
              pinnedImage ??
              (productImages.length > 0
                ? productImages[category.handle.length % productImages.length]
                : null)

            const imageUrl =
              (category.metadata?.image as string | undefined) ??
              thumbnail ??
              null

            return (
              <a
                key={category.id}
                href={`/categories/${category.handle}`}
                className="group block overflow-hidden no-underline transition-shadow duration-200 hover:shadow-lg"
                style={{
                  borderRadius: "5px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#ffffff",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                {/* Image area */}
                <div
                  className="relative overflow-hidden"
                  style={{ height: "210px", backgroundColor: "#dce5ee" }}
                >
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={category.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                  {productCount > 0 && (
                    <span
                      className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        borderRadius: "4px",
                        color: "#333333",
                      }}
                    >
                      {productCount} products
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div className="p-5">
                  <h3
                    className="text-base font-semibold mb-2"
                    style={{ color: "#111111" }}
                  >
                    {category.name}
                  </h3>
                  <p
                    className="text-[13px] leading-relaxed mb-4 line-clamp-2"
                    style={{ color: "#555555" }}
                  >
                    {description}
                  </p>
                  <span
                    className="inline-flex items-center gap-1 text-[13px] font-medium"
                    style={{ color: "#E3000F" }}
                  >
                    Browse category
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M6 12l4-4-4-4"
                        stroke="#E3000F"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
              </a>
            )
          })}

          {/* All Category CTA card */}
          <a
            href="/categories"
            className="relative flex flex-col justify-end overflow-hidden no-underline transition-opacity duration-200 hover:opacity-90"
            style={{
              borderRadius: "5px",
              backgroundColor: "#E3000F",
              minHeight: "310px",
              textDecoration: "none",
            }}
          >
            {/* Decorative illustration — file lives at /public/images/category-group.svg */}
            <img
              src="/images/category-group.svg"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ opacity: 0.75 }}
            />

            <div className="relative z-10 p-6">
              <span
                className="inline-flex items-center gap-2 text-lg font-semibold"
                style={{ color: "#ffffff" }}
              >
                All Category
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M6 12l4-4-4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </a>
        </div>
      </div>
    </section>
  )
}
