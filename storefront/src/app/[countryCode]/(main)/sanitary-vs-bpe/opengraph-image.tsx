import { builderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@modules/builder/components/og/builder-og"

// opengraph card for this route and its children without their own image (simplified schematic + title).
export const alt = "Schematic: CDU port to hose to far-end fitting, with size labels"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return builderOgImage({ eyebrow: "Explainer · Sanitary grade", title: "Sanitary stainless or ASME BPE: what a liquid cooling loop needs", schematic: "kit" })
}
