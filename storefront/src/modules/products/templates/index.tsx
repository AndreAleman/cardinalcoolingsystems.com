// src/modules/products/templates/index.tsx
import { PortableText } from "@portabletext/react"
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

type SanityTab = {
  _key: string
  title: string
  content: any[]
}

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  selectedVariant?: HttpTypes.StoreProductVariant | null  // ← ADDED
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
  selectedVariant,  // ← ADDED
  sanity,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  const allTabs: SanityTab[] = []

  if (sanity?.description && sanity.description.length > 0) {
    allTabs.push({
      _key: 'product-description',
      title: 'Product Description',
      content: sanity.description
    })
  }

  if (sanity?.tabs) {
    allTabs.push(...sanity.tabs)
  }
  
  console.log('🔍 Product categories:', product.categories)
  console.log('🔍 Has categories?', product.categories && product.categories.length > 0)
  if (product.categories && product.categories.length > 0) {
    console.log('🔍 First category:', product.categories[0])
    console.log('🔍 Category name:', product.categories[0].name)
    console.log('🔍 Category handle:', product.categories[0].handle)
  }

  // Get category breadcrumb chain
  const primaryCategory = product.categories?.[0]
  const parentCategory = primaryCategory?.parent_category

  return (
    <div className="bg-white">
      {/* Main Product Section */}
      <div className="content-container">
        <div className="max-w-6xl mx-auto">
          {/* ✅ Breadcrumbs with Categories */}
          <nav className="flex items-center gap-2 text-sm pt-12 pb-1 border-b border-ui-border-base mb-1" aria-label="Breadcrumb">
            <Link 
              href="/" 
              className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
            >
              Home
            </Link>
            
            <svg className="w-4 h-4 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            <Link 
              href="/store" 
              className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
            >
              Products
            </Link>

            {/* Show category if exists */}
            {product.categories && product.categories.length > 0 && (
              <>
                <svg className="w-4 h-4 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <Link 
                  href={`/categories/${product.categories[0].handle}`}
                  className="text-ui-fg-subtle hover:text-ui-fg-base transition-colors"
                >
                  {product.categories[0].name}
                </Link>
              </>
            )}
            
            <svg className="w-4 h-4 text-ui-fg-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            
            <span className="text-ui-fg-base font-medium truncate">
              {product.title}
            </span>
          </nav>

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
                    <ProductActionsWrapper 
                      id={product.id} 
                      region={region}
                      selectedVariant={selectedVariant}  // ← ADDED: Pass selected variant
                    />
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

      {/* Product Content Tabs */}
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
              </h2>
              <p className="text-ui-fg-subtle">
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
