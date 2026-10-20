// Page-specific metadata for the builder section: title, description, canonical, Open Graph and
// Twitter. Without it, a page that sets only `title`/`description` inherits the (main) layout's
// whole `openGraph` and `twitter` objects, so every share card read the site default.
//
// Images come from the file convention: `opengraph-image.tsx` / `twitter-image.tsx` in the route
// segment (or the nearest parent). File-based images win over `images` set here, so the helper
// only sets `images` when a page passes one explicitly.

import type { Metadata } from "next"
import { canonicalUrl } from "./page"

export const SITE_NAME = "Cardinal Cooling Systems"

export type BuilderMetadataInput = {
  countryCode: string
  /** Page title without the " | Cardinal Cooling Systems" suffix. */
  title: string
  description: string
  /** Path under the country prefix, e.g. "/build/cdu-kit". */
  path: string
  /** Optional absolute or root-relative image URL; normally the route's opengraph-image file. */
  image?: { url: string; alt: string }
  robots?: Metadata["robots"]
}

export function builderMetadata({ countryCode, title, description, path, image, robots }: BuilderMetadataInput): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`
  const url = canonicalUrl(countryCode, path)
  const images = image ? [{ url: image.url, width: 1200, height: 630, alt: image.alt }] : undefined
  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
    ...(robots ? { robots } : {}),
  }
}
