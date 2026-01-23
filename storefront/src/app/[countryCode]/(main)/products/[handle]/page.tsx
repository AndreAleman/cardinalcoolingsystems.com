import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { client } from "../../../../../sanity/lib/client"

type Props = {
  params: { countryCode: string; handle: string }
  searchParams: Record<string, string>
}

export async function generateStaticParams() {
  const countryCodes = await listRegions().then(
    (regions) =>
      regions
        ?.map((r) => r.countries?.map((c) => c.iso_2))
        .flat()
        .filter(Boolean) as string[]
  )

  if (!countryCodes) {
    return null
  }

  const products = await Promise.all(
    countryCodes.map((countryCode) => {
      return getProductsList({ countryCode })
    })
  ).then((responses) =>
    responses.map(({ response }) => response.products).flat()
  )

  const staticParams = countryCodes
    ?.map((countryCode) =>
      products.map((product) => ({
        countryCode,
        handle: product.handle,
      }))
    )
    .flat()

  return staticParams
}

function findVariantByOptions(product: any, searchParams: Record<string, string>) {
  if (!searchParams || Object.keys(searchParams).length === 0) {
    return null
  }

  return product.variants?.find((variant: any) => {
    return variant.options?.every((opt: any) => {
      const optionName = opt.option.title.toLowerCase()
      let optionValue = opt.value.toLowerCase()
      
      optionValue = optionValue.replace(/["'']/g, 'in').replace(/\s+/g, '')
      
      const searchValue = searchParams[optionName]?.toLowerCase()
      return searchValue === optionValue
    })
  })
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { handle } = params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const product = await getProductByHandle(handle, region.id)

  if (!product) {
    notFound()
  }

  const selectedVariant = findVariantByOptions(product, searchParams) || product.variants?.[0]

  const optionString = selectedVariant?.options
    ?.map((opt: any) => `${opt.option.title}: ${opt.value}`)
    .join(", ") || ""

  return {
    title: optionString 
      ? `${product.title} - ${optionString} | Cardinal Cooling Systems`
      : `${product.title} | Cardinal Cooling Systems`,
    description: optionString
      ? `${product.title} with ${optionString}. SKU: ${selectedVariant?.sku}. ${product.description || ''}`
      : product.description || product.title,
    
    alternates: {
      canonical: `https://cardinalcoolingsystems.com/${params.countryCode}/products/${handle}`
    },
    
    openGraph: {
      title: optionString 
        ? `${product.title} - ${optionString}`
        : product.title,
      description: product.description || product.title,
      images: selectedVariant?.thumbnail 
        ? [selectedVariant.thumbnail] 
        : product.thumbnail 
          ? [product.thumbnail] 
          : [],
    },
  }
}

export default async function ProductPage({ params, searchParams }: Props) {
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await getProductByHandle(params.handle, region.id)
  if (!pricedProduct) {
    notFound()
  }

  const sanity = (await client.getDocument(pricedProduct.id))

  const selectedVariant = findVariantByOptions(pricedProduct, searchParams)
  
  // ✅ CREATE PRODUCT SCHEMA - Adjusted for MedusaJS data structure
  const variant = selectedVariant || pricedProduct.variants?.[0]
  
  // Price is already in dollars (not cents) in calculated_amount
  const price = variant?.calculated_price?.calculated_amount
    ? variant.calculated_price.calculated_amount.toFixed(2)
    : null

  const productSchema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: pricedProduct.title,
    description: pricedProduct.description || pricedProduct.subtitle || pricedProduct.title,
    image: pricedProduct.thumbnail || pricedProduct.images?.[0]?.url,
    sku: variant?.sku || pricedProduct.id,
    brand: {
      "@type": "Brand",
      name: "Cardinal Cooling Systems"
    },
    offers: {
      "@type": "Offer",
      url: `https://cardinalcoolingsystems.com/${params.countryCode}/products/${params.handle}`,
      priceCurrency: region.currency_code.toUpperCase(),
      price: price,
      availability: variant?.inventory_quantity && variant.inventory_quantity > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: {
        "@type": "Organization",
        name: "Cardinal Cooling Systems"
      }
    }
  }

  // Add category - use the first (most specific) category
  if (pricedProduct.categories && pricedProduct.categories.length > 0) {
    productSchema.category = pricedProduct.categories[0].name
  }

  // Add material from variant options if "Alloy" option exists
  const alloyOption = variant?.options?.find((opt: any) => opt.option.title === "Alloy")
  if (alloyOption) {
    productSchema.material = alloyOption.value
  }

  return (
    <>
      {/* ✅ PRODUCT SCHEMA JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema).replace(/</g, '\\u003c')
        }}
      />
      
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        selectedVariant={selectedVariant}
        sanity={{
          description: sanity?.description ?? [],
          tabs: sanity?.tabs ?? [],
        }}
      />
    </>
  )
}
