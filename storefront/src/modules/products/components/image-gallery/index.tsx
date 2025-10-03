"use client"

import { useState, useRef } from "react"
import { HttpTypes } from "@medusajs/types"
import Image from "next/image"
import {clsx} from "clsx"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const imageRef = useRef<HTMLDivElement>(null)
  
  const main = images[selectedIndex]

  // Handle mouse move for zoom effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setMousePosition({ x, y })
  }

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] mx-auto" id="pdp-image-gallery">
      {/* Main image (centered, larger) */}
      <div className="w-[400px] h-[440px] rounded bg-ui-bg-subtle mb-4 relative overflow-hidden flex items-center justify-center group">
        {main?.url && (
          <div
            ref={imageRef}
            className="relative w-full h-full cursor-zoom-in"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
          >
            <Image
              src={main.url}
              alt={`Product Image ${selectedIndex + 1}`}
              fill
              priority
              sizes="400px"
              className={clsx(
                "object-cover rounded transition-transform duration-300",
                {
                  "scale-150": isZoomed,
                }
              )}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                    }
                  : { objectFit: "cover" }
              }
            />
          </div>
        )}
        
        {/* Zoom hint */}
        {!isZoomed && main?.url && (
          <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Hover to zoom
          </div>
        )}
      </div>

      {/* Gallery thumbnail strip */}
      {images.length > 1 && (
        <div className="flex flex-row gap-2 mt-2">
          {images.map((image, idx) => (
            <button
              key={image.id}
              className={clsx(
                "w-12 h-12 rounded overflow-hidden border-2 bg-ui-bg-subtle transition-all duration-100 flex-shrink-0 focus:outline-none",
                idx === selectedIndex
                  ? "border-blue-600 ring-2 ring-blue-300"
                  : "border-gray-200 opacity-80 hover:border-blue-400"
              )}
              aria-label={`Select image ${idx + 1}`}
              type="button"
              onClick={() => setSelectedIndex(idx)}
            >
              <Image
                src={image.url}
                alt={`Thumbnail ${idx + 1}`}
                width={48}
                height={48}
                className="object-cover w-full h-full"
                draggable={false}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default ImageGallery