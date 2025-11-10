import { MetadataRoute } from 'next'
import { getProductsList } from '@lib/data/products'
import { listRegions } from '@lib/data/regions'

// Helper to escape XML characters
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Helper function to clean option values for URL
function cleanOptionValue(value: string): string {
  return value
    .toLowerCase()
    .replace(/"/g, 'in')
    .replace(/'/g, 'ft')
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Helper function to clean option names for URL
function cleanOptionName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, '-')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://cardinalcoolingsystems.com'
  
  const regions = await listRegions()
  const countryCodes = regions
    ?.map((r) => r.countries?.map((c) => c.iso_2))
    .flat()
    .filter(Boolean) as string[]

  const countryCode = countryCodes[0] || 'us'

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/${countryCode}/store`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/${countryCode}/account`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  const { response } = await getProductsList({
    countryCode,
    queryParams: { 
      limit: 9999,
      fields: 'id,handle,updated_at,variants.id,variants.options.value,variants.options.option.title'
    }
  })

  const productUrls: MetadataRoute.Sitemap = []

  response.products.forEach((product) => {
    // Add parent product URL (canonical)
    productUrls.push({
      url: `${baseUrl}/${countryCode}/products/${product.handle}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    })

    // Add variant URLs
    if (product.variants && product.variants.length > 1) {
      product.variants.forEach((variant) => {
        if (variant.options && variant.options.length > 0) {
          const queryParams = variant.options
            .map((opt: any) => {
              if (!opt.option?.title || !opt.value) return null
              
              const optionName = cleanOptionName(opt.option.title)
              const optionValue = cleanOptionValue(opt.value)
              
              return `${optionName}=${optionValue}`
            })
            .filter(Boolean)
            .join('&')

          if (queryParams) {
            // ✅ FIXED: Escape the URL for XML
            const fullUrl = `${baseUrl}/${countryCode}/products/${product.handle}?${queryParams}`
            
            productUrls.push({
              url: escapeXml(fullUrl),  // ← Escape the & to &amp;
              lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
              changeFrequency: 'weekly',
              priority: 0.7,
            })
          }
        }
      })
    }
  })

  return [...staticPages, ...productUrls]
}
