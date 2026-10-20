import { builderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@modules/builder/components/og/builder-og"

// opengraph card for this route (simplified schematic + title). A child page that sets its own
// openGraph does not inherit a parent's file-based image, so each builder route has one.
export const alt = "Schematic: CDU port to hose to far-end fitting, with size labels"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return builderOgImage({ eyebrow: 'Boyd 10U CDU · 1.5" tri-clamp', title: "Boyd 10U CDU hookup kit: 1.5\" tri-clamp, sized from the datasheet", schematic: "kit" })
}
