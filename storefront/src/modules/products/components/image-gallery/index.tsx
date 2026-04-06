"use client"

import { useEffect, useState, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { clsx } from "clsx"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const logoPath = "/images/logo/new-cardinal-cooling-logo.svg"

  // Filter out localhost images
  const validImages = images?.filter(img => img?.url && !img.url.includes("localhost")) || []

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)

  const mainImageUrl = validImages[selectedIndex]?.url || logoPath
  const isLogo = !validImages[selectedIndex]?.url

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current || isLogo) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] mx-auto" id="pdp-image-gallery">
      {/* Main image */}
      <div
        className="w-[400px] h-[440px] rounded mb-4 relative overflow-hidden flex items-center justify-center group"
        style={{ backgroundColor: isLogo ? "#E3000F" : undefined }}
      >
        <div
          ref={imageRef}
          className={clsx("relative w-full h-full", {
            "cursor-zoom-in": !isLogo,
            "cursor-default": isLogo,
          })}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => !isLogo && setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
        >
          <ImageOrPlaceholder
            image={mainImageUrl}
            isZoomed={isZoomed}
            mousePosition={mousePosition}
          />
        </div>

        {/* Zoom hint */}
        {!isZoomed && !isLogo && mainImageUrl && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Hover to zoom
          </div>
        )}
      </div>

      {/* Thumbnail bar */}
      {validImages.length > 1 && (
        <div className="flex flex-row gap-2 mt-2">
          {validImages.map((image, idx) => {
            const thumbSrc = image.url || logoPath
            const isThumbLogo = !image.url
            return (
              <button
                key={image.id}
                className={clsx(
                  "w-12 h-12 rounded overflow-hidden transition-all duration-100 flex-shrink-0 focus:outline-none border-2",
                  {
                    "border-red-600 ring-2 ring-red-300": idx === selectedIndex,
                    "border-gray-200 opacity-80 hover:border-red-400": idx !== selectedIndex,
                  }
                )}
                style={isThumbLogo ? { backgroundColor: "#E3000F" } : { backgroundColor: "#f8f8f8" }}
                aria-label={`Select image ${idx + 1}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
              >
                <Image
                  src={thumbSrc}
                  alt={`Thumbnail ${idx + 1}`}
                  width={48}
                  height={48}
                  className="w-full h-full"
                  style={{
                    objectFit: isThumbLogo ? "contain" : "cover",
                    padding: isThumbLogo ? "4px" : undefined,
                    filter: isThumbLogo ? "brightness(0) invert(1)" : undefined,
                  }}
                  draggable={false}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const ImageOrPlaceholder = ({
  image,
  isZoomed,
  mousePosition,
}: {
  image?: string
  isZoomed: boolean
  mousePosition: { x: number; y: number }
}) => {
  const logoPath = "/images/logo/new-cardinal-cooling-logo.svg"
  const [imgSrc, setImgSrc] = useState(image || logoPath)
  const [isLogo, setIsLogo] = useState(!image)

  useEffect(() => {
    setImgSrc(image || logoPath)
    setIsLogo(!image)
  }, [image])

  return (
    <div
      className="w-full h-full absolute inset-0"
      style={isLogo ? { backgroundColor: "#E3000F" } : {}}
    >
      <Image
        src={imgSrc}
        alt="Product image"
        fill
        className={clsx(
          "absolute inset-0 w-full h-full transition-transform duration-300",
          {
            "object-cover": !isLogo,
            "object-contain p-10": isLogo,
            "scale-150": isZoomed && !isLogo,
          }
        )}
        style={
          isZoomed && !isLogo
            ? { transformOrigin: `${mousePosition.x}% ${mousePosition.y}%` }
            : isLogo
            ? { objectFit: "contain", filter: "brightness(0) invert(1)" }
            : { objectFit: "cover" }
        }
        sizes="400px"
        quality={75}
        onError={() => {
          setImgSrc(logoPath)
          setIsLogo(true)
        }}
      />
    </div>
  )
}

export default ImageGallery
