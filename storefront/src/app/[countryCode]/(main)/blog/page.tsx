import { client } from "../../../../../src/sanity/lib/client"
import { groq } from "next-sanity"
import Link from "next/link"

// Type definitions
interface Category {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
  image?: {
    asset?: {
      _id: string
      url: string
    }
    alt?: string
  }
  postCount?: number
}

interface RecentPost {
  _id: string
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  excerpt?: string
  mainImage?: {
    asset?: {
      _id: string
      url: string
    }
    alt?: string
  }
  categories?: Category[]
}

// GROQ queries
const CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    image{
      asset->{
        _id,
        url
      },
      alt
    },
    "postCount": count(*[_type == "post" && references(^._id)])
  }
`

const RECENT_POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...6] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage{
      asset->{
        _id,
        url
      },
      alt
    },
    categories[]->{
      title,
      slug
    }
  }
`

export default async function BlogCategoriesPage({ params }: { params: { countryCode: string } }) {
  const [categories, recentPosts] = await Promise.all([
    client.fetch(CATEGORIES_QUERY),
    client.fetch(RECENT_POSTS_QUERY)
  ])
  
  const { countryCode } = params

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-white pt-36 pb-16 lg:pt-40">
        <div className="content-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-gray-900 mb-6">
              Industry Expertise & Technical Resources
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Expert guidance on sanitary fittings, industry applications, and technical best practices 
              for food processing, pharmaceuticals, brewing, and biotechnology operations.
            </p>
            <p className="text-lg text-gray-500">
              Choose your industry to access specialized content and solutions
            </p>
          </div>
        </div>
      </section>

      {/* Dynamic Categories from Sanity */}
      <section className="bg-gray-50 py-16">
        <div className="content-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Browse by Category</h2>
            <p className="text-lg text-gray-600">
              Find specialized content tailored to your specific industry requirements
            </p>
          </div>

          {categories && categories.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category: Category) => (
                <Link
                  key={category._id}
                  href={`/${countryCode}/blog/category/${category.slug.current}`}
                  className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300 border border-gray-200"
                >
                  {/* Category Image */}
                  {category.image?.asset?.url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={category.image.asset.url}
                        alt={category.image.alt || category.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {category.title}
                        </h3>
                        
                        {/* Category description if available */}
                        {category.description && (
                          <p className="text-gray-600 text-sm leading-relaxed mb-3">
                            {category.description}
                          </p>
                        )}
                        
                        {/* Post count */}
                        {category.postCount !== undefined && (
                          <div className="text-xs text-gray-500">
                            {category.postCount} {category.postCount === 1 ? 'article' : 'articles'}
                          </div>
                        )}
                      </div>
                      
                      {/* Arrow icon */}
                      <div className="text-gray-400 group-hover:text-blue-600 transition-colors ml-4">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            // Empty state when no categories exist
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
              <p className="text-gray-600">Categories will appear here once you create them in your Studio.</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Posts Preview */}
      {recentPosts && recentPosts.length > 0 && (
        <section className="bg-white py-16">
          <div className="content-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Latest Articles</h2>
              <p className="text-lg text-gray-600">
                Stay updated with the newest technical insights and industry developments
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.slice(0, 6).map((post: RecentPost) => (
                <article 
                  key={post._id}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Featured Image */}
                  {post.mainImage?.asset?.url && (
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    {/* Category badge */}
                    {post.categories && post.categories.length > 0 && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {post.categories[0].title}
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      <Link href={`/${countryCode}/blog/${post.slug.current}`}>
                        {post.title}
                      </Link>
                    </h3>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Date */}
                    <div className="text-xs text-gray-500">
                      {post.publishedAt && (
                        <time dateTime={post.publishedAt}>
                          {new Date(post.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </time>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* View All Posts Link */}
            <div className="text-center mt-12">
              <Link 
                href={`/${countryCode}/blog/all`}
                className="inline-flex items-center px-6 py-3 border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-300"
              >
                View All Articles
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
