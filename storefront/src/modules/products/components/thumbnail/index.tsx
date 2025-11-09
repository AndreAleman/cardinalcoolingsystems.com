"use client"

import { Container, clx } from "@medusajs/ui"
import Image from "next/image"
import React from "react"

type ThumbnailProps = {
  thumbnail?: string | null
  images?: any[] | null
  size?: "small" | "medium" | "large" | "full" | "square"
  isFeatured?: boolean
  className?: string
  "data-testid"?: string
}

const Thumbnail: React.FC<ThumbnailProps> = ({
  thumbnail,
  images,
  size = "small",
  isFeatured,
  className,
  "data-testid": dataTestid,
}) => {
  const initialImage = thumbnail || images?.[0]?.url

  return (
    <Container
      className={clx(
        "relative w-full overflow-hidden bg-gray-100",
        className,
        {
          "aspect-[11/14]": isFeatured,
          "aspect-square": !isFeatured && size !== "square",
          "aspect-[1/1]": size === "square",
          "w-[180px]": size === "small",
          "w-[290px]": size === "medium", 
          "w-[440px]": size === "large",
          "w-full": size === "full",
        }
      )}
      data-testid={dataTestid}
    >
      <ImageOrPlaceholder image={initialImage} size={size} />
    </Container>
  )
}

const ImageOrPlaceholder = ({
  image,
  size,
}: Pick<ThumbnailProps, "size"> & { image?: string }) => {
  const logoPath = "/images/logo/logo-main-3.svg"
  const [imgSrc, setImgSrc] = React.useState(image || logoPath)
  const [isLogo, setIsLogo] = React.useState(!image)

  React.useEffect(() => {
    setImgSrc(image || logoPath)
    setIsLogo(!image)
  }, [image])

  return (
    <div className={clx(
      "w-full h-full absolute inset-0",
      { "bg-white": isLogo }
    )}>
      <Image
        src={imgSrc}
        alt="Product thumbnail"
        fill
        className={clx(
          "absolute inset-0 w-full h-full",
          {
            "object-cover object-center": !isLogo,
            "object-contain object-center p-4": isLogo
          }
        )}
        draggable={false}
        quality={50}
        sizes="(max-width: 576px) 280px, (max-width: 768px) 360px, (max-width: 992px) 480px, 800px"
        onError={() => {
          setImgSrc(logoPath)
          setIsLogo(true)
        }}
      />
    </div>
  )
}

export default Thumbnail
