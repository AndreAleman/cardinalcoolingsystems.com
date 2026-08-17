import { Metadata } from "next"
import Hero from "@modules/home/components/hero"
import ProductRangeWrapper from "../product-range-wrapper"
import SanitaryProducts from "@modules/home/components/sanitary-products"
import AboutUs from "@modules/home/components/about-us"
import ContactForm from "@modules/home/components/contact-form"
import { getCollectionsWithProducts } from "@lib/data/collections"
import { getRegion } from "@lib/data/regions"
import SanitubeSection from '@modules/home/components/suppliers';

export const metadata: Metadata = {
  title: "Stainless Steel Tubing, Fittings, and Valves | Cardinal Cooling Systems",
  description:
    "Shop sanitary stainless steel tubing, fittings, and valves for food, beverage, pharmaceutical, and industrial applications. Authorized Sanitube distributor.",
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

  return (
    <>
      <Hero />
      <ProductRangeWrapper products={rangeProducts} />
      <SanitubeSection />
      

     
        {/*  <IndustriesSupport /> */}

      <SanitaryProducts />

      <AboutUs />

      <ContactForm />
    </>
  )
}
