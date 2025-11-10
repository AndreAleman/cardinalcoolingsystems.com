import { Metadata } from "next"
import { notFound } from "next/navigation"

import ProductTemplate from "@modules/products/templates"
import { getRegion, listRegions } from "@lib/data/regions"
import { getProductByHandle, getProductsList } from "@lib/data/products"
import { client } from "../../../../../sanity/lib/client"

type Props = {
  params: { countryCode: string; handle: string }
  searchParams: Record<string, string>  // ← ADDED: For variant options
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

// ← ADDED: Helper function to find variant by options
function findVariantByOptions(product: any, searchParams: Record<string, string>) {
  if (!searchParams || Object.keys(searchParams).length === 0) {
    return null
  }

  return product.variants?.find((variant: any) => {
    return variant.options?.every((opt: any) => {
      const optionName = opt.option.title.toLowerCase()
      const optionValue = opt.value.toLowerCase()
      const searchValue = searchParams[optionName]?.toLowerCase()
      return searchValue === optionValue
    })
  })
}

// ← UPDATED: Add searchParams to metadata
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

  // ← ADDED: Find selected variant if options in URL
  const selectedVariant = findVariantByOptions(product, searchParams) || product.variants?.[0]

  // ← ADDED: Build option string for title/description
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
    
    // ← ADDED: Canonical tag to parent (no query params)
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

// ← UPDATED: Add searchParams parameter
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
  console.log("parent:", JSON.stringify(sanity, null, 2))

  // ← ADDED: Find selected variant from URL options
  const selectedVariant = findVariantByOptions(pricedProduct, searchParams)

  return (
    <>
      {/* ← ADDED: Canonical link tag */}
      <link 
        rel="canonical" 
        href={`https://cardinalcoolingsystems.com/${params.countryCode}/products/${params.handle}`} 
      />
      
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
        selectedVariant={selectedVariant}  // ← ADDED: Pass selected variant
        sanity={{
          description: sanity?.description ?? [],
          tabs: sanity?.tabs ?? [],
        }}
      />
    </>
  )
}
