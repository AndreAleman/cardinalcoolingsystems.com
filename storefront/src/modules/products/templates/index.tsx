// src/modules/products/templates/index.tsx
import { PortableText } from "@portabletext/react"
import React, { Suspense } from "react"
// import { htmlToBlockContent } from "@/lib/htmlToBlockContent" // KEEP COMMENTED OUT
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

type SanityTab = {
  _key: string
  title: string
  content: any[]
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  sanity?: {
    description?: any[]
    content?: string
    tabs?: SanityTab[]
  }
}

const ProductTemplate: React.FC<ProductTemplateProps> = async ({
  product,
  region,
  countryCode,
  sanity,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  // Create tabs array from Sanity content
  const allTabs: SanityTab[] = []

  // Add Sanity description as main product description
  if (sanity?.description && sanity.description.length > 0) {
    allTabs.push({
      _key: 'product-description',
      title: 'Product Description',
      content: sanity.description
    })
  }

  // Add any existing Sanity tabs
  if (sanity?.tabs) {
    allTabs.push(...sanity.tabs)
  }

  return (
    <div className="bg-white">
      {/* Main Product Section */}
      <div className="content-container">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-8 py-8 lg:py-12">
            
            {/* Left Column - Image Gallery */}
            <div className="w-full lg:w-1/2">
              <div className="sticky top-8">
                <ImageGallery images={product?.images || []} />
              </div>
            </div>

            {/* Right Column - Product Details */}
            <div className="w-full lg:w-1/2">
              <div className="lg:sticky lg:top-8 space-y-8 lg:pl-4 lg:pr-8 xl:pr-12">
                
                <ProductOnboardingCta />

                <div className="space-y-6">
                  <ProductInfo
                    product={product}
                    sanity={{ content: sanity?.content ?? "" }}
                  />
                </div>

                <div className="space-y-6">
                  <Suspense
                    fallback={
                      <ProductActions
                        disabled={true}
                        product={product}
                        region={region}
                      />
                    }
                  >
                    <ProductActionsWrapper id={product.id} region={region} />
                  </Suspense>
                </div>

                <div className="border-t border-ui-border-base pt-8">
                  <ProductTabs product={product} />
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Content Tabs - Renders migrated Sanity content */}
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
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-ui-fg-base mb-2">
                Related Products
              </h2>
              <p className="text-ui-fg-subtle">
                You might also like these products
              </p>
            </div>
            
            <Suspense fallback={<SkeletonRelatedProducts />}>
              <RelatedProducts product={product} countryCode={countryCode} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTemplate
