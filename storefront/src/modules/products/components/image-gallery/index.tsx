"use client"

import { useEffect, useState, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import { clsx } from "clsx"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const logoPath = "/images/logo/logo-main-3.svg"
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mainImgSrc, setMainImgSrc] = useState(images[0]?.url || logoPath)
  const [isMainLogo, setIsMainLogo] = useState(!images[0]?.url)
  const imageRef = useRef<HTMLDivElement>(null)

  // Always update the main image when selected index changes
  useEffect(() => {
    const newSrc = images[selectedIndex]?.url || logoPath
    setMainImgSrc(newSrc)
    setIsMainLogo(!images[selectedIndex]?.url)
  }, [selectedIndex, images])

  const main = images[selectedIndex]

  // Handle mouse move for zoom effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current || isMainLogo) return
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setMousePosition({ x, y })
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] mx-auto" id="pdp-image-gallery">
      {/* Main image */}
      <div className={clsx(
        "w-[400px] h-[440px] rounded mb-4 relative overflow-hidden flex items-center justify-center group",
        {
          "bg-white border-2 border-gray-300": isMainLogo,
          "bg-ui-bg-subtle": !isMainLogo
        }
      )}>
        <div
          ref={imageRef}
          className={clsx(
            "relative w-full h-full",
            {
              "cursor-zoom-in": !isMainLogo,
              "cursor-default": isMainLogo
            }
          )}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => !isMainLogo && setIsZoomed(true)}
          onMouseLeave={() => setIsZoomed(false)}
        >
          <Image
            src={mainImgSrc}
            alt={`Product Image ${selectedIndex + 1}`}
            fill
            priority
            sizes="400px"
            className={clsx(
              "rounded transition-transform duration-300",
              {
                "object-cover": !isMainLogo,
                "object-contain p-8": isMainLogo,
                "scale-150": isZoomed && !isMainLogo,
              }
            )}
            style={
              isZoomed && !isMainLogo
                ? {
                  transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                }
                : { objectFit: isMainLogo ? "contain" : "cover" }
            }
            onError={() => {
              setMainImgSrc(logoPath)
              setIsMainLogo(true)
            }}
          />
        </div>
        {/* Zoom hint */}
        {!isZoomed && !isMainLogo && main?.url && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Hover to zoom
          </div>
        )}
      </div>

      {/* Thumbnail bar */}
      {images.length > 1 && (
        <div className="flex flex-row gap-2 mt-2">
          {images.map((image, idx) => {
            const thumbSrc = image.url || logoPath
            const isThumbLogo = !image.url
            return (
              <button
                key={image.id}
                className={clsx(
                  "w-12 h-12 rounded overflow-hidden transition-all duration-100 flex-shrink-0 focus:outline-none",
                  {
                    "bg-white border-2": isThumbLogo,
                    "bg-ui-bg-subtle border-2": !isThumbLogo,
                    "border-blue-600 ring-2 ring-blue-300": idx === selectedIndex,
                    "border-gray-300": idx !== selectedIndex && isThumbLogo,
                    "border-gray-200 opacity-80 hover:border-blue-400": idx !== selectedIndex && !isThumbLogo
                  }
                )}
                aria-label={`Select image ${idx + 1}`}
                type="button"
                onClick={() => setSelectedIndex(idx)}
              >
                <Image
                  src={thumbSrc}
                  alt={`Thumbnail ${idx + 1}`}
                  width={48}
                  height={48}
                  className={clsx(
                    "w-full h-full",
                    {
                      "object-cover": !isThumbLogo,
                      "object-contain p-1": isThumbLogo
                    }
                  )}
                  draggable={false}
                  onError={() => {
                    // Fallback: nothing to update but required for robustness
                  }}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ImageGallery
