import { Metadata } from "next"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export const metadata: Metadata = {
  title: "Shop All Products | Cardinal Cooling Systems",
  description: "Explore our complete range of sanitary stainless steel products including tubes, valves, and fittings.",
}

type Params = {
  searchParams: {
    sortBy?: SortOptions
    page?: string
    category_id?: string
    material?: string
    size?: string
    q?: string
  }
  params: {
    countryCode: string
  }
}

export default async function StorePage({ searchParams, params }: Params) {
  const { sortBy, page, category_id, material, size, q } = searchParams

  return (
    <>
      {/* Hero */}
<section
  className="pt-40 pb-12 px-6 lg:px-12"
  style={{ backgroundColor: "rgba(227, 0, 15, 0.06)" }}
>
  <div className="mx-auto max-w-[1440px]">
    <nav
      className="flex items-center gap-2 text-sm mb-8"
      style={{ color: "rgba(0,0,0,0.45)" }}
    >
      <a
        href={`/${params.countryCode}`}
        className="hover:text-black transition-colors"
      >
        Home
      </a>
      <span>/</span>
      <span style={{ color: "rgba(0,0,0,0.7)" }}>Shop</span>
    </nav>

    <p
      className="text-xs font-normal tracking-widest uppercase mb-4"
      style={{ color: "#E3000F" }}
    >
      All Products
    </p>

    <h1 className="font-sans text-4xl lg:text-6xl font-normal tracking-tight text-black leading-tight mb-4">
      Shop All Products
    </h1>

    <p
      className="text-base font-light leading-relaxed max-w-2xl mb-6"
      style={{ color: "rgba(0,0,0,0.7)" }}
    >
      Precision-engineered sanitary stainless steel products. From welded tubing
      to industrial valves and fittings.
    </p>

    <div
      className="flex flex-wrap gap-4 text-xs"
      style={{ color: "rgba(0,0,0,0.55)" }}
    >
      <span>✓ ASTM A269 &amp; A270 Standards</span>
      <span>✓ 3A Certified</span>
      <span>✓ 304 &amp; 316L Stainless</span>
      <span>✓ Ships in 1 Business Day</span>
    </div>
  </div>
</section>

      {/* Store */}
      <StoreTemplate
        sortBy={sortBy}
        page={page}
        countryCode={params.countryCode}
        category_id={category_id}
        material={material}
        size={size}
        q={q}
      />
    </>
  )
}
