import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCategoryByHandle, getCategoriesList, listCategories } from "@lib/data/categories"
import { listRegions } from "@lib/data/regions"
import { StoreProductCategory, StoreRegion } from "@medusajs/types"
import CategoryTemplate from "@modules/categories/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import Link from "next/link"

type Props = {
  params: { category: string[]; countryCode: string }
  searchParams: { sortBy?: SortOptions; page?: string }
}

export async function generateStaticParams() {
  const product_categories = await listCategories()
  if (!product_categories) return []

  const countryCodes = await listRegions().then((regions: StoreRegion[]) =>
    regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
  )

  const categoryHandles = product_categories.map((category: any) => category.handle)

  return countryCodes
    ?.map((countryCode: string | undefined) =>
      categoryHandles.map((handle: any) => ({ countryCode, category: [handle] }))
    )
    .flat()
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { product_categories } = await getCategoryByHandle(params.category)
    if (!product_categories || product_categories.length === 0) {
      return { title: "Category not found" }
    }
    const mainCategory = product_categories[product_categories.length - 1]
    const title = product_categories.map((c: StoreProductCategory) => c.name).join(" | ")
    const description = mainCategory.description ?? `${title} category.`

    const seoTitle = (mainCategory.metadata?.seo_title as string) || `${title} | Cardinal Cooling Systems`
    const seoDescription = (mainCategory.metadata?.seo_description as string) || description

    return {
      title: seoTitle,
      description: seoDescription,
      alternates: {
        canonical: `https://cardinalcoolingsystems.com/${params.countryCode}/categories/${params.category.join("/")}`,
      },
    }
  } catch {
    return { title: "Category not found" }
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { sortBy, page } = searchParams

  // Fetch current category + ALL categories in parallel
  const [{ product_categories }, { product_categories: allCategories }] = await Promise.all([
    getCategoryByHandle(params.category),
    getCategoriesList(0, 200),
  ])

  if (!product_categories || product_categories.length === 0) notFound()

  const mainCategory = product_categories[product_categories.length - 1]
  if (!mainCategory) notFound()

  // Build breadcrumbs
  const breadcrumbs = [
    { label: "Home", href: `/${params.countryCode}` },
    { label: "Categories", href: `/${params.countryCode}/categories` },
    ...product_categories.slice(0, -1).map((cat: StoreProductCategory, idx: number) => ({
      label: cat.name,
      href: `/${params.countryCode}/categories/${params.category.slice(0, idx + 1).join("/")}`,
    })),
    { label: mainCategory.name, href: "#" },
  ]

  return (
    <div>
      {/* Dark header */}
      <section className="pt-32 pb-10 px-6 lg:px-12" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto max-w-[1440px]">
          <nav className="flex items-center gap-2 text-sm mb-6 flex-wrap" style={{ color: "rgba(255,255,255,0.35)" }}>
            {breadcrumbs.map((crumb, idx) => (
              <span key={idx} className="flex items-center gap-2">
                {idx > 0 && <span>/</span>}
                {crumb.href === "#" ? (
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="hover:text-white transition-colors">{crumb.label}</Link>
                )}
              </span>
            ))}
          </nav>

          <p className="text-xs font-normal tracking-widest uppercase mb-3" style={{ color: "#E3000F" }}>
            Category
          </p>
          <h1 className="font-sans text-4xl lg:text-5xl font-normal tracking-tight text-white mb-3">
            {mainCategory.name}
          </h1>
        </div>
      </section>

      <CategoryTemplate
        categories={product_categories}
        allCategories={allCategories}
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
      />
    </div>
  )
}
