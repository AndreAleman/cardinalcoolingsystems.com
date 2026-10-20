import { builderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@modules/builder/components/og/builder-og"

// opengraph card for this route and its children without their own image (simplified schematic + title).
export const alt = "Schematic: row manifold header with drops at a fixed pitch"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return builderOgImage({ eyebrow: "TCS Row Manifold · OCP guideline", title: "OCP TCS row manifold: 316L header, drops at your pitch, 1-inch fill", schematic: "manifold" })
}
