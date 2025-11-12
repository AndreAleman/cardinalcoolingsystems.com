// product-card.tsx
import Image from "next/image"
import IconButton from "../../common/components/icon-button"

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------
export interface ProductCardProps {
  id: string
  title: string
  subtitle: string
  image: string
  onAdd: (id: string) => void
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------
export default function ProductCard({
  id,
  title,
  subtitle,
  image,
  onAdd,
}: ProductCardProps) {
  return (
    <div
      className="flex flex-col h-full w-full bg-gray-50 shadow-sm p-5"
    >
      {/* Product image - Fixed aspect ratio */}
      <div className="relative w-full aspect-square mb-4">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, 33vw"
        />
      </div>

      {/* Title - Always 2 lines with ellipsis */}
      <h3 
        className="font-semibold text-gray-900 text-base leading-tight mb-2 line-clamp-2 min-h-[2.5rem]"
        title={title}
      >
        {title}
      </h3>

      {/* Subtitle removed - no product description in card */}

      {/* Add-to-cart button - pushed to bottom */}
      <div className="mt-auto pt-4">
        <IconButton
          label="View Product"
          icon="plus"
          onClick={() => onAdd(id)}
          className="w-full"
        />
      </div>
    </div>
  )
}
