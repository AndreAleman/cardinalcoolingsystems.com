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

export const metadata: Metadata = {
  title: "Stainless Steel Tubing, Fittings, and Valves | Cowbird Depot",
  description:
    "this is where to edit",
}

export default async function Home({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  // Fetch data
  const collections = await getCollectionsWithProducts(countryCode)
  const region = await getRegion(countryCode)

  if (!collections || !region) {
    return null
  }

  // Prepare products for the range section
  const rangeProducts = collections
    ?.flatMap(collection => collection.products || [])
    ?.slice(0, 8)
    ?.map((p) => ({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle ?? p.title ?? "Product",
      image: p.thumbnail ?? "/images/placeholder.jpg",
      handle: p.handle,
    })) ?? []

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

  return (
    <>
      <Hero />

      <ProductRangeWrapper products={rangeProducts} />

     
        {/*  <IndustriesSupport /> */}

      <SanitaryProducts />

      <AboutUs />

      <ContactForm />
    </>
  )
}
