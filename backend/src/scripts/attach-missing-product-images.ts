// Attaches real photos to Cardinal products that have none (GMC rejects
// placeholder product images).
//
// Source of truth for photos: SaniTube's catalog. For each Cardinal product
// with no thumbnail and no images, the script looks for the same product
//   1. elsewhere in Cardinal's own catalog (another product sharing a variant
//      SKU that already has images), then
//   2. in SaniTube's public Store API, by handle first, then by variant SKU.
// Matched images are downloaded, uploaded to Cardinal's own media bucket
// through the file module (so Cardinal never hot-links SaniTube's bucket),
// and set as the product's images + thumbnail.
//
// Products with no match are listed so someone can shoot or source a photo.
//
// Dry run (default, read-only):
//   SANITUBE_PUBLISHABLE_KEY=pk_... npx medusa exec ./src/scripts/attach-missing-product-images.ts
// Write:
//   SANITUBE_PUBLISHABLE_KEY=pk_... npx medusa exec ./src/scripts/attach-missing-product-images.ts apply
//
// Env:
//   SANITUBE_PUBLISHABLE_KEY  SaniTube storefront publishable key (public;
//                             NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY in sanitube.us)
//   SANITUBE_STORE_URL        default https://backend-production-cf202.up.railway.app
//
// Idempotent: products that already have an image are never touched.

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  updateProductsWorkflow,
  uploadFilesWorkflow,
} from "@medusajs/medusa/core-flows"

type SourceProduct = {
  id: string
  handle: string
  title?: string
  thumbnail?: string | null
  images?: { url?: string | null }[] | null
  variants?: { sku?: string | null }[] | null
}

type Plan = {
  productId: string
  handle: string
  title: string
  source: string
  imageUrls: string[]
}

const DEFAULT_SANITUBE_URL = "https://backend-production-cf202.up.railway.app"

function imageUrlsOf(p: SourceProduct): string[] {
  const urls = [p.thumbnail, ...(p.images ?? []).map((i) => i?.url)]
    .filter((u): u is string => !!u)
  return [...new Set(urls)]
}

const hasImage = (p: SourceProduct) => imageUrlsOf(p).length > 0

const skusOf = (p: SourceProduct) =>
  (p.variants ?? [])
    .map((v) => (v?.sku ?? "").trim().toUpperCase())
    .filter(Boolean)

async function fetchSanitubeProducts(
  baseUrl: string,
  publishableKey: string
): Promise<SourceProduct[]> {
  const out: SourceProduct[] = []
  let offset = 0
  for (;;) {
    const url =
      `${baseUrl}/store/products?limit=100&offset=${offset}` +
      `&fields=id,handle,title,thumbnail,images.url,variants.sku`
    const res = await fetch(url, {
      headers: { "x-publishable-api-key": publishableKey },
    })
    if (!res.ok) {
      throw new Error(`SaniTube Store API ${res.status} on ${url}`)
    }
    const body = (await res.json()) as { products: SourceProduct[]; count: number }
    out.push(...body.products)
    offset += 100
    if (offset >= body.count) break
  }
  return out
}

function extensionOf(url: string, contentType: string | null): string {
  const fromUrl = url.split("?")[0].match(/\.(jpe?g|png|webp|gif)$/i)?.[1]
  if (fromUrl) return fromUrl.toLowerCase()
  if (contentType?.includes("png")) return "png"
  if (contentType?.includes("webp")) return "webp"
  return "jpg"
}

export default async function attachMissingProductImages({
  container,
  args,
}: ExecArgs) {
  const apply = (args ?? []).includes("apply")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const sanitubeUrl = process.env.SANITUBE_STORE_URL || DEFAULT_SANITUBE_URL
  const sanitubeKey = process.env.SANITUBE_PUBLISHABLE_KEY
  if (!sanitubeKey) {
    logger.error(
      "SANITUBE_PUBLISHABLE_KEY is not set (SaniTube storefront's NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY)."
    )
    return
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "title", "status", "thumbnail", "images.url", "variants.sku"],
  })

  const cardinal = products as unknown as (SourceProduct & { status: string })[]
  const missing = cardinal.filter((p) => !hasImage(p))
  logger.info(`Cardinal products: ${cardinal.length}; with no image: ${missing.length}`)
  if (!missing.length) return

  const sanitube = await fetchSanitubeProducts(sanitubeUrl, sanitubeKey)
  logger.info(`SaniTube products fetched: ${sanitube.length}`)

  const index = (list: SourceProduct[]) => {
    const byHandle = new Map<string, SourceProduct>()
    const bySku = new Map<string, SourceProduct>()
    for (const p of list) {
      if (!hasImage(p)) continue
      byHandle.set(p.handle, p)
      for (const sku of skusOf(p)) if (!bySku.has(sku)) bySku.set(sku, p)
    }
    return { byHandle, bySku }
  }
  const own = index(cardinal)
  const st = index(sanitube)

  const plans: Plan[] = []
  const unmatched: (SourceProduct & { status: string })[] = []

  for (const p of missing) {
    let match: SourceProduct | undefined
    let source = ""

    for (const sku of skusOf(p)) {
      const hit = own.bySku.get(sku)
      if (hit && hit.id !== p.id) {
        match = hit
        source = `cardinal:${hit.handle} (sku ${sku})`
        break
      }
    }
    if (!match && st.byHandle.has(p.handle)) {
      match = st.byHandle.get(p.handle)
      source = `sanitube:${p.handle} (handle)`
    }
    if (!match) {
      for (const sku of skusOf(p)) {
        const hit = st.bySku.get(sku)
        if (hit) {
          match = hit
          source = `sanitube:${hit.handle} (sku ${sku})`
          break
        }
      }
    }

    if (match) {
      plans.push({
        productId: p.id,
        handle: p.handle,
        title: p.title ?? p.handle,
        source,
        imageUrls: imageUrlsOf(match),
      })
    } else {
      unmatched.push(p)
    }
  }

  logger.info(`\n=== Will attach images (${plans.length}) ===`)
  for (const plan of plans) {
    logger.info(`${plan.handle}  <-  ${plan.source}`)
    for (const u of plan.imageUrls) logger.info(`    ${u}`)
  }

  logger.info(`\n=== No photo found anywhere (${unmatched.length}) — needs a real photo ===`)
  for (const p of unmatched) {
    logger.info(`${p.handle}  [${p.status}]  skus: ${skusOf(p).slice(0, 4).join(", ")}`)
  }

  if (!apply) {
    logger.info("\nDry run: nothing written. Re-run with `apply` to upload and attach.")
    return
  }

  for (const plan of plans) {
    const files: { filename: string; mimeType: string; content: string; access: "public" }[] = []
    for (const [i, url] of plan.imageUrls.entries()) {
      const res = await fetch(url)
      if (!res.ok) {
        logger.warn(`  skip ${url}: HTTP ${res.status}`)
        continue
      }
      const contentType = res.headers.get("content-type")
      const ext = extensionOf(url, contentType)
      const buffer = Buffer.from(await res.arrayBuffer())
      files.push({
        filename: `${plan.handle}-${i}.${ext}`,
        mimeType: contentType || `image/${ext === "jpg" ? "jpeg" : ext}`,
        // The store's file provider (src/modules/minio-file) decodes base64.
        content: buffer.toString("base64"),
        access: "public",
      })
    }
    if (!files.length) {
      logger.warn(`${plan.handle}: no image could be downloaded; skipped`)
      continue
    }

    const { result: uploaded } = await uploadFilesWorkflow(container).run({
      input: { files },
    })
    const urls = uploaded.map((f) => f.url)

    await updateProductsWorkflow(container).run({
      input: {
        selector: { id: plan.productId },
        update: {
          thumbnail: urls[0],
          images: urls.map((url) => ({ url })),
        },
      },
    })
    logger.info(`${plan.handle}: attached ${urls.length} image(s)`)
  }

  logger.info("Done.")
}
