import React, { Suspense } from "react"
import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import ProductActionsWrapper from "./product-actions-wrapper"
import { HttpTypes } from "@medusajs/types"
import SanityTabs from "../components/sanity-tabs"
import Link from "next/link"
import ProductViewTracker from "@modules/products/components/product-view-tracker"

type SanityTab = {
  _key: string
  title: string
  content: any[]
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  selectedVariant?: HttpTypes.StoreProductVariant | null
  sanity?: {
    description?: any[]
    technicalDetails?: any[]
    content?: string
    tabs?: SanityTab[]
  }
}

const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
  selectedVariant,
  sanity,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const allTabs: SanityTab[] = []

  // Product description from Medusa — plain text converted to PortableText block
  if (product.description && product.description.trim().length > 0) {
    allTabs.push({
      _key: "product-description-medusa",
      title: "Product Description",
      content: [
        {
          _type: "block",
          _key: "desc-block",
          style: "normal",
          children: [{ _type: "span", _key: "desc-span", text: product.description }],
          markDefs: [],
        },
      ],
    })
  }

  // Technical Details from Sanity description field
  if (sanity?.description && sanity.description.length > 0) {
    allTabs.push({
      _key: "product-description",
      title: "Technical Details",
      content: sanity.description,
    })
  }

  // Technical Specifications from new Sanity technicalDetails field
  if (sanity?.technicalDetails && sanity.technicalDetails.length > 0) {
    allTabs.push({
      _key: "technical-details",
      title: "Technical Specifications",
      content: sanity.technicalDetails,
    })
  }

  // Any additional custom tabs from Sanity
  if (sanity?.tabs) {
    allTabs.push(...sanity.tabs)
  }

  const variantInfo = selectedVariant?.options
    ?.map((opt: any) => opt.value)
    .filter(Boolean)
    .join(", ")

  const h1Text = variantInfo
    ? `${product.title} - ${variantInfo}`
    : product.title

  return (
    <div className="bg-white">
      <ProductViewTracker product={product} selectedVariant={selectedVariant} />

      {/* Main Product Section */}
      <div className="content-container">
        <div className="max-w-6xl mx-auto">

          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm pt-12 pb-4 mb-4 border-b border-gray-100 flex-wrap" aria-label="Breadcrumb">
            <Link href="/" className="transition-colors hover:text-gray-900" style={{ color: "#9ca3af" }}>Home</Link>
            <span style={{ color: "#d1d5db" }}>›</span>
            <Link href="/store" className="transition-colors hover:text-gray-900" style={{ color: "#9ca3af" }}>Products</Link>
            {product.categories && product.categories.length > 0 && (
              <>
                <span style={{ color: "#d1d5db" }}>›</span>
                <Link href={`/categories/${product.categories[0].handle}`} className="transition-colors hover:text-gray-900" style={{ color: "#9ca3af" }}>
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span style={{ color: "#d1d5db" }}>›</span>
            <span className="truncate" style={{ color: "#111111" }}>{product.title}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-start gap-8 py-8 lg:py-12">

            {/* Left — Image Gallery */}
            <div className="w-full lg:w-1/2">
              <div className="sticky top-8">
                <ImageGallery images={product?.images || []} />
              </div>
            </div>

            {/* Right — Product Details */}
            <div className="w-full lg:w-1/2">
              <div className="lg:sticky lg:top-8 space-y-6 lg:pl-4 lg:pr-8 xl:pr-12">

                <ProductOnboardingCta />

                {/* H1 */}
                <h1 className="text-3xl lg:text-4xl font-semibold leading-tight" style={{ color: "#111111" }}>
                  {h1Text}
                </h1>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5"
                    style={{ backgroundColor: "rgba(227,0,15,0.08)", borderRadius: "5px" }}
                  >
                    <img src="/images/certifications/3a-logo.svg" alt="3-A Certified" className="h-5 w-auto" />
                    <span className="text-xs font-medium" style={{ color: "#E3000F" }}>3A Certified</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5" style={{ backgroundColor: "#f8f8f8", color: "#6b7280", borderRadius: "5px" }}>
                    304 &amp; 316L Stainless
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5" style={{ backgroundColor: "#f8f8f8", color: "#6b7280", borderRadius: "5px" }}>
                    Ships in 1 Business Day
                  </span>
                </div>

                {/* Product info (SKU, description) */}
                <ProductInfo
                  product={product}
                  sanity={{ content: sanity?.content ?? "" }}
                />

                {/* Product actions */}
                <Suspense fallback={
                  <ProductActions disabled={true} product={product} region={region} />
                }>
                  <ProductActionsWrapper id={product.id} region={region} selectedVariant={selectedVariant} />
                </Suspense>

                {/* Accordion tabs — Product Information + Shipping & Returns */}
                <div className="border-t border-gray-100 pt-6">
                  <ProductTabs product={product} variant={selectedVariant} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sanity content tabs — Product Description, Technical Details, custom tabs */}
      {allTabs.length > 0 && (
        <div className="bg-ui-bg-subtle">
          <div className="content-container">
            <div className="max-w-6xl mx-auto py-12">
              <SanityTabs tabs={allTabs} />
            </div>
          </div>
        </div>
      )}

      {/* Related Products */}
      <div className="content-container">
        <div className="max-w-6xl mx-auto py-12">
          <Suspense fallback={<SkeletonRelatedProducts />}>
            <RelatedProducts product={product} countryCode={countryCode} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default ProductTemplate
