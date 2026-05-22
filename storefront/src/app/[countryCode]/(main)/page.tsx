import { Metadata } from "next"
import dynamic from "next/dynamic"
import Hero from "@modules/home/components/hero"
import TrustBanner from "@modules/home/components/trust-banner"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import { client } from "../../../../src/sanity/lib/client"
import { groq } from "next-sanity"
import { sdk } from "@lib/config"

const ProductRangeWrapper = dynamic(() => import("../product-range-wrapper"))
const IndustriesServed = dynamic(() => import("@modules/home/components/industries-served"))
const ProductCategories = dynamic(() => import("@modules/home/components/product-categories"))
const WhyUs = dynamic(() => import("@modules/home/components/why-us"))
const QuoteForm = dynamic(() => import("@modules/home/components/quote-form"))







export const metadata: Metadata = {
  title: "Stainless Steel Tubing, Fittings & Valves | Cardinal Cooling Systems",
  description:
    "Premium 304 & 316 stainless steel sanitary tubing, fittings, and valves for data centers, HVAC, and industrial cooling systems. 3A certified. Fast delivery.",
  alternates: {
    canonical: 'https://cardinalcoolingsystems.com/us'
  }
}


const RECENT_POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...3] {
    _id,
    title,
    slug,
    excerpt,
    mainImage{
      asset->{
        url
      },
      alt
    }
  }
`


export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  // Fetch data
  const [collections, region, recentPosts, categoriesData] = await Promise.all([
    getCollectionsWithProducts(countryCode),
    getRegion(countryCode),
    client.fetch(RECENT_POSTS_QUERY),
    sdk.store.category.list({
      fields: "id,name,handle,description,metadata,*products,products.id,products.thumbnail,products.images,products.images.url,products.images.rank",
    }),
  ])

  const categories = categoriesData.product_categories

  if (!collections || !region) {
    return null
  }

  // Prepare products for the range section
  const rangeProducts =
    collections
      ?.flatMap((collection) => collection.products || [])
      ?.slice(0, 8)
      ?.map((p) => {
        const variants = p.variants || []

        const pricedVariants = variants
          .map((v: any) => {
            const rawAmount = v.calculated_price?.calculated_amount

            if (typeof rawAmount !== "number") {
              return null
            }

            return {
              variant: v,
              amount: rawAmount,
            }
          })
          .filter((x) => !!x && x.amount > 0)

        let lowestPrice: number | undefined
        let spec: string | undefined

        if (pricedVariants.length > 0) {
          const min = pricedVariants.reduce((acc, cur) =>
            cur.amount < acc.amount ? cur : acc
          )

          // In new Medusa, amount is already in major units
          lowestPrice = min.amount

          const v = min.variant

          const size =
            v.metadata?.size ||
            v.metadata?.nominal_size ||
            v.metadata?.diameter

          const material =
            v.metadata?.material ||
            p.metadata?.material ||
            (p as any).material

          const connection =
            v.metadata?.connection ||
            p.metadata?.connection

          const parts = [size, material, connection].filter(Boolean)
          spec = parts.join(" • ")
        }

        return {
          id: p.id,
          title: p.title,
          subtitle: spec || p.subtitle || p.title || "Product",
          image: p.thumbnail ?? "/images/placeholder.jpg",
          handle: p.handle,
          price: lowestPrice,
        }
      }) ?? []

  // Tube category data
  const tubeImages = [
    {
      id: "tube-1",
      src: "/images/tube-detail.jpg",
      alt: "Stainless steel tubing detail"
    },
    {
      id: "tube-2",
      src: "/images/industrial-equipment.jpg",
      alt: "Industrial processing equipment"
    },
    {
      id: "tube-3",
      src: "/images/piping-system.jpg",
      alt: "Outdoor piping system"
    },
    {
      id: "tube-4",
      src: "/images/steel-tank.jpg",
      alt: "Stainless steel tank detail"
    }
  ]

  console.log("prices:", rangeProducts.map(p => `${p.title}: ${p.price}`))

  return (
    <>
      <Hero />
      <TrustBanner />
      <ProductRangeWrapper products={rangeProducts} />
      <IndustriesServed />
      <ProductCategories categories={categories} />
      <WhyUs />
      <QuoteForm />
    </>
  )
}
