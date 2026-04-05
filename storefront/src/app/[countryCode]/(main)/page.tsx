import { Metadata } from "next"
import Hero from "@modules/home/components/hero"
import ProductRangeWrapper from "../product-range-wrapper"
import ProductCategorySection from "@modules/home/components/product-category-section"
import IndustriesSupport from "@modules/home/components/industries-support"
import SanitaryProducts from "@modules/home/components/sanitary-products"
import AboutUs from "@modules/home/components/about-us"
import ContactForm from "@modules/home/components/contact-form"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import MeiliSearchComponent from "@modules/search/components/meilisearch-component"
import SanitubeSection from '@modules/home/components/suppliers'
import { client } from "../../../../src/sanity/lib/client"
import { groq } from "next-sanity"
import TrustBanner from "@modules/home/components/trust-banner"


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
  const [collections, region, recentPosts] = await Promise.all([
    getCollectionsWithProducts(countryCode),
    getRegion(countryCode),
    client.fetch(RECENT_POSTS_QUERY)
  ])



  if (!collections || !region) {
    return null
  }



  // Prepare products for the range section
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
      <Hero/>
      <TrustBanner />

      <ProductRangeWrapper products={rangeProducts} />
      <SanitubeSection />
      



     
        {/*        <SanitaryProducts /><IndustriesSupport /> */}



      



     {/*} <AboutUs />*/}



      <ContactForm />
    </>
  )
}
