import { MetadataRoute } from 'next'
import { getProductsList } from '@lib/data/products'
import { listRegions } from '@lib/data/regions'
import { listCategories } from '@lib/data/categories'
import { client } from '../../sanity/lib/client'
import { groq } from 'next-sanity'

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
      // Canonical homepage is the localized route (bare "/" 307-redirects here)
      url: `${baseUrl}/${countryCode}`,
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
      url: `${baseUrl}/${countryCode}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${countryCode}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/${countryCode}/account`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]

  // Products — one canonical parent URL per product.
  // (No variant/query-param URLs; a variant is not a separately indexable page.)
  const { response } = await getProductsList({
    countryCode,
    queryParams: {
      limit: 9999,
      fields: 'id,handle,updated_at',
    },
  })

  const productUrls: MetadataRoute.Sitemap = response.products.map((product) => ({
    url: `${baseUrl}/${countryCode}/products/${product.handle}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  // Product categories (Medusa) — e.g. /us/categories/valves
  const productCategories = await listCategories()

  const categoryPageUrls: MetadataRoute.Sitemap = productCategories
    .filter((category) => category.handle)
    .map((category) => ({
      url: `${baseUrl}/${countryCode}/categories/${category.handle}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

  // Blog posts (Sanity)
  const blogPosts = await client.fetch(groq`
    *[_type == "post" && defined(slug.current) && publishedAt <= now()] {
      "slug": slug.current,
      _updatedAt
    }
  `)

  const blogUrls: MetadataRoute.Sitemap = blogPosts.map((post: any) => ({
    url: `${baseUrl}/${countryCode}/blog/${post.slug}`,
    lastModified: new Date(post._updatedAt),
    changeFrequency: 'monthly',
    priority: 0.7,
  }))

  // Blog categories (Sanity)
  const blogCategories = await client.fetch(groq`
    *[_type == "category" && defined(slug.current)] {
      "slug": slug.current,
      _updatedAt
    }
  `)

  const blogCategoryUrls: MetadataRoute.Sitemap = blogCategories.map((category: any) => ({
    url: `${baseUrl}/${countryCode}/blog/category/${category.slug}`,
    lastModified: new Date(category._updatedAt),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [
    ...staticPages,
    ...productUrls,
    ...categoryPageUrls,
    ...blogUrls,
    ...blogCategoryUrls,
  ]
}
