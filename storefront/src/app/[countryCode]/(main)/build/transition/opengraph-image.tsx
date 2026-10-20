import { builderOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@modules/builder/components/og/builder-og"

// opengraph card for this route (simplified schematic + title). A child page that sets its own
// openGraph does not inherit a parent's file-based image, so each builder route has one.
export const alt = "Schematic: CDU port to hose to far-end fitting, with size labels"
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

export default function Image() {
  return builderOgImage({ eyebrow: "Transition Spool · Tri-clamp × flange, NPT, grooved", title: "Tri-clamp to flange, NPT or grooved: transition spools", schematic: "kit" })
}
