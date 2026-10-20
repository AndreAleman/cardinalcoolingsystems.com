import { builderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@modules/builder/components/og/builder-og"

// opengraph card for this route and its children without their own image (simplified schematic + title).
export const alt = "Schematic: CDU port to hose to far-end fitting, with size labels"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return builderOgImage({ eyebrow: "Builders · Data center liquid cooling", title: "What are you connecting? CDU kits, row manifolds, spools, strainers, hoses", schematic: "kit" })
}
