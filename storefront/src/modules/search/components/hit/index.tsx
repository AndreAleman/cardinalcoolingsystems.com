import { Container, Text, Badge } from "@medusajs/ui"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export type ProductHit = {
  id: string
  title: string
  handle: string
  description: string | null
  thumbnail: string | null
  variants: HttpTypes.StoreProductVariant[]
  collection_handle: string | null
  collection_id: string | null
}

type HitProps = {
  hit: ProductHit
  searchQuery?: string
}

const Hit = ({ hit, searchQuery }: HitProps) => {
  console.log('🔍 === HIT DEBUG ===')
  console.log('Search query:', searchQuery)
  console.log('Product:', hit.title)
  console.log('Variants count:', hit.variants?.length)
  if (hit.variants?.[0]) {
    console.log('First variant SKU:', hit.variants[0].sku)
    console.log('First variant metadata:', hit.variants[0].metadata)
  }
  // Find which variant matches the search query
  const matchedVariant = searchQuery 
    ? hit.variants?.find(v => {
        const query = searchQuery.toLowerCase()
        
        // Check if SKU matches
        if (v.sku?.toLowerCase().includes(query)) {
          console.log('✅ SKU Match:', v.sku, 'for query:', query)
          return true
        }
        
        // Check if competitor SKUs match
        const competitorSkus = v.metadata?.competitor_skus as string[] | undefined
        if (competitorSkus?.some(sku => sku.toLowerCase().includes(query))) {
          console.log('✅ Competitor SKU Match:', competitorSkus, 'for query:', query)
          return true
        }
        
        return false
      })
    : null

  console.log('Search query:', searchQuery)
  console.log('Matched variant:', matchedVariant?.sku)

  // Get variant display info (alloy + size)
  const getVariantOptions = (variant: HttpTypes.StoreProductVariant) => {
    if (!variant.options) return null
    
    const optionsMap: Record<string, string> = {}
    variant.options.forEach((opt: any) => {
      if (opt.option?.title && opt.value) {
        optionsMap[opt.option.title] = opt.value
      }
    })
    
    return optionsMap
  }

  const variantOptions = matchedVariant ? getVariantOptions(matchedVariant) : null
  const competitorSkus = matchedVariant?.metadata?.competitor_skus as string[] | undefined
  
  // Build deep link with variant SKU
  const productUrl = matchedVariant 
    ? `/products/${hit.handle}?sku=${matchedVariant.sku}`
    : `/products/${hit.handle}`

  return (
    <LocalizedClientLink
      href={productUrl}
      data-testid="search-result"
    >
      <Container className="flex gap-3 w-full p-3 shadow-elevation-card-rest hover:shadow-elevation-card-hover items-start">
        {/* Product Image - Fixed aspect ratio */}
        <div className="relative w-16 h-16 shrink-0 bg-ui-bg-subtle rounded-md overflow-hidden">
          {hit.thumbnail ? (
            <Image
              src={hit.thumbnail}
              alt={hit.title}
              fill
              className="object-contain"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ui-fg-subtle">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          {/* Title with variant options inline */}
          <div className="flex items-center gap-2 flex-wrap">
            <Text className="text-sm font-medium text-ui-fg-base">
              {hit.title}
            </Text>
            {matchedVariant && variantOptions && (
              <>
                {variantOptions['Alloy'] && (
                  <Badge size="small" className="text-xs shrink-0">
                    {variantOptions['Alloy']}
                  </Badge>
                )}
                {variantOptions['Size (Tube OD)'] && (
                  <Badge size="small" className="text-xs shrink-0">
                    {variantOptions['Size (Tube OD)']}
                  </Badge>
                )}
              </>
            )}
          </div>
          
          {/* SKU */}
          {matchedVariant && (
            <Text className="text-xs text-ui-fg-subtle font-mono">
              SKU: {matchedVariant.sku}
            </Text>
          )}
          
          {/* Compatible SKUs */}
          {competitorSkus && competitorSkus.length > 0 && (
            <Text className="text-xs text-ui-fg-muted">
              Compatible: {competitorSkus.join(', ')}
            </Text>
          )}
        </div>
      </Container>
    </LocalizedClientLink>
  )
}

export default Hit
