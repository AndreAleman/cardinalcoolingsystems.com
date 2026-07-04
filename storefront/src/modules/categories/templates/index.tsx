"use client"

import { notFound } from "next/navigation"
import { Suspense, useState } from "react"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type FaqItem = { question: string; answer: string }

function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="divide-y divide-gray-100">
      {faqs.map((faq, idx) => (
        <div key={idx}>
          <button
            className="w-full flex items-center justify-between py-5 text-left gap-4"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            aria-expanded={openIndex === idx}
          >
            <span className="text-sm font-medium leading-snug" style={{ color: "#111111" }}>
              {faq.question}
            </span>
            <span
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-transform duration-200"
              style={{ transform: openIndex === idx ? "rotate(45deg)" : "rotate(0deg)", color: "#E3000F" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </button>
          {openIndex === idx && (
            <div className="pb-5">
              <p className="text-sm font-light leading-relaxed" style={{ color: "#555555" }}>
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function CategoryCard({ cat, getImage }: { cat: any; getImage: (c: any) => string | null }) {
  const img = getImage(cat)
  return (
    <LocalizedClientLink
      key={cat.id}
      href={`/categories/${cat.handle}`}
      className="group block overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 bg-white"
      style={{ borderRadius: "5px" }}
    >
      <div
        className="overflow-hidden flex items-center justify-center"
        style={{ aspectRatio: "4/3", backgroundColor: "#f8f8f8" }}
      >
        {img ? (
          <img
            src={img}
            alt={cat.name}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: "#E3000F" }}>
            <img
              src="/images/logo/new-cardinal-cooling-logo.svg"
              alt="Cardinal Cooling Systems"
              className="w-full h-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </div>
        )}
      </div>
      <div className="p-4">
        <p className="text-sm font-semibold leading-snug transition-colors group-hover:text-red-600 mb-1" style={{ color: "#111111" }}>
          {cat.name}
        </p>
        {cat.description && (
          <p className="text-xs font-light leading-relaxed line-clamp-2" style={{ color: "#9ca3af" }}>
            {cat.description}
          </p>
        )}
      </div>
    </LocalizedClientLink>
  )
}

export default function CategoryTemplate({
  categories,
  allCategories = [],
  sortBy,
  page,
  countryCode,
}: {
  categories: HttpTypes.StoreProductCategory[]
  allCategories?: HttpTypes.StoreProductCategory[]
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const category = categories[categories.length - 1] as any

  if (!category || !countryCode) notFound()

  const getImage = (cat: any): string | null => {
    if (cat.metadata?.image) return cat.metadata.image as string
    if (cat.metadata?.featured_image) return cat.metadata.featured_image as string
    const products = cat.products ?? []
    for (const p of products) {
      if (p.thumbnail) return p.thumbnail
      if (p.images?.[0]?.url) return p.images[0].url
    }
    return null
  }

  const categoryImage = getImage(category)
  // The page's single <h1> is the category name rendered in the dark header.
  // CMS-authored SEO content sometimes starts with its own <h1>, which would
  // produce a second H1 on the page — demote any <h1> here to <h2>.
  const rawSeoContent = category.metadata?.seo_content as string | undefined
  const seoContent = rawSeoContent?.replace(/<(\/?)h1(\b[^>]*)>/gi, "<$1h2$2>")

  // Parse FAQs
  let faqs: FaqItem[] = []
  try {
    const raw = category.metadata?.faq_items
    if (raw) faqs = typeof raw === "string" ? JSON.parse(raw) : raw
  } catch { faqs = [] }

  // Silo-based related categories
  // Tier 1 & 2: show own children (subcategory grid)
  // Tier 3 (no children): show siblings from same parent
  const children: any[] = category.category_children ?? []
  const hasChildren = children.length > 0

  const siblings: any[] = hasChildren ? [] : allCategories
    .filter((c: any) => c.parent_category_id === category.parent_category_id && c.id !== category.id)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Sort children by rank
  const sortedChildren = [...children].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))

  return (
    <div className="bg-white">

      {/* Hero image */}
      {categoryImage && (
        <div
          className="w-full flex items-center justify-center"
          style={{ backgroundColor: "#f0f4f8", maxHeight: "480px", overflow: "hidden" }}
        >
          <img
            src={categoryImage}
            alt={category.name}
            style={{ maxHeight: "480px", width: "100%", objectFit: "contain", display: "block" }}
          />
        </div>
      )}

      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">

        {/* Description */}
        {category.description && (
          <div className="py-8 max-w-3xl border-b border-gray-100">
            <p className="text-sm font-light leading-relaxed" style={{ color: "#555555" }}>
              {category.description}
            </p>
          </div>
        )}

        {/* Tier 1 & 2: Subcategories grid */}
        {hasChildren && (
          <div className="py-10 border-b border-gray-100">
            <p className="text-xs font-normal tracking-widest uppercase mb-6" style={{ color: "#E3000F" }}>
              Subcategories
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {sortedChildren.map((child: any) => (
                <CategoryCard key={child.id} cat={child} getImage={getImage} />
              ))}
            </div>
          </div>
        )}

        {/* Tier 3: Sibling categories scroll row */}
        {!hasChildren && siblings.length > 0 && (
          <div className="py-10 border-b border-gray-100">
            <p className="text-xs font-normal tracking-widest uppercase mb-5" style={{ color: "#E3000F" }}>
              Related Categories
            </p>
            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {siblings.map((sib: any) => {
                const img = getImage(sib)
                return (
                  <LocalizedClientLink
                    key={sib.id}
                    href={`/categories/${sib.handle}`}
                    className="group flex-none block overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-300 bg-white"
                    style={{ borderRadius: "5px", width: "clamp(160px, 35vw, 200px)" }}
                  >
                    <div
                      className="overflow-hidden flex items-center justify-center"
                      style={{ aspectRatio: "1/1", backgroundColor: "#f8f8f8" }}
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={sib.name}
                          className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                          style={{ objectFit: "contain" }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-8" style={{ backgroundColor: "#E3000F" }}>
                          <img
                            src="/images/logo/new-cardinal-cooling-logo.svg"
                            alt="Cardinal Cooling Systems"
                            className="w-full h-auto"
                            style={{ filter: "brightness(0) invert(1)" }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold leading-snug transition-colors group-hover:text-red-600 line-clamp-2" style={{ color: "#111111" }}>
                        {sib.name}
                      </p>
                    </div>
                  </LocalizedClientLink>
                )
              })}
            </div>
          </div>
        )}

        {/* Products */}
        <div className="py-10">
          <p className="text-xs font-normal tracking-widest uppercase mb-6" style={{ color: "#E3000F" }}>
            Products
          </p>
          <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-start">
            <RefinementList sortBy={sort} data-testid="sort-by-container" />
            <div className="flex-1 min-w-0">
              <Suspense fallback={<SkeletonProductGrid />}>
                <PaginatedProducts
                  sortBy={sort}
                  page={pageNumber}
                  categoryId={category.id}
                  countryCode={countryCode}
                />
              </Suspense>
            </div>
          </div>
        </div>

        {/* SEO content — below products */}
        {seoContent && (
          <div
            className="py-12 border-t border-gray-100 max-w-3xl
              [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mb-4 [&_h1]:mt-0 [&_h1]:leading-tight
              [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:leading-tight
              [&_p]:text-sm [&_p]:leading-relaxed [&_p]:mb-4
              [&_ul]:mb-4 [&_ul]:pl-5
              [&_li]:text-sm [&_li]:leading-relaxed [&_li]:mb-1 [&_li]:list-disc
              [&_strong]:font-medium"
            style={{ color: "#555555" }}
            dangerouslySetInnerHTML={{ __html: seoContent }}
          />
        )}

        {/* FAQ */}
        {faqs.length > 0 && (
          <div className="py-12 border-t border-gray-100 max-w-3xl">
            <p className="text-xs font-normal tracking-widest uppercase mb-2" style={{ color: "#E3000F" }}>
              FAQ
            </p>
            <h2 className="text-2xl font-semibold mb-8" style={{ color: "#111111" }}>
              Frequently Asked Questions
            </h2>
            <FaqAccordion faqs={faqs} />
          </div>
        )}

      </div>
    </div>
  )
}
