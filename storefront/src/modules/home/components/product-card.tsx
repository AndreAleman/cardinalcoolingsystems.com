import Image from "next/image"
import IconButton from "../../common/components/icon-button" // <-- adjust path if different

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
      className="snap-start shrink-0 w-[327px] sm:w-[260px] h-[493px]
                 bg-gray-50 shadow-sm p-5 flex flex-col justify-between"
    >
      {/* product image */}
      <Image
        src={image}
        alt={title}
        width={297}
        height={297}
        className="aspect-square w-full object-cover"
      />

      {/* title + subtitle */}
      <div className="mt-4">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{subtitle}</p>
      </div>

      {/* add-to-cart button */}
      <IconButton
        label="Add to cart"
        icon="plus"
        onClick={() => onAdd(id)}
        className="self-end"
      />
    </div>
  )
}
