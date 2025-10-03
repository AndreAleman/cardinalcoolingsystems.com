import { client } from "../../../../../../sanity/lib/client"
import { groq } from "next-sanity"
import Link from "next/link"
import { notFound } from "next/navigation"

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
}

interface RelatedCategory {
  _id: string
  title: string
  slug: {
    current: string
  }
  postCount?: number
}

interface CategoryPost {
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
  author?: {
    name: string
    slug: {
      current: string
    }
  }
  categories?: {
    title: string
    slug: {
      current: string
    }
  }[]
}

// GROQ queries
const CATEGORY_QUERY = groq`
  *[_type == "category" && slug.current == $slug][0] {
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
    }
  }
`

const CATEGORY_POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current) && references(*[_type=="category" && slug.current == $slug]._id)] | order(publishedAt desc) {
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
    author->{
      name,
      slug
    },
    categories[]->{
      title,
      slug
    }
  }
`

const RELATED_CATEGORIES_QUERY = groq`
  *[_type == "category" && slug.current != $slug] | order(title asc)[0...6] {
    _id,
    title,
    slug,
    "postCount": count(*[_type == "post" && references(^._id)])
  }
`

interface Props {
  params: { countryCode: string; slug: string }
}

export default async function CategoryArchivePage({ params }: Props) {
  const { countryCode, slug } = params

  const [category, posts, relatedCategories] = await Promise.all([
    client.fetch(CATEGORY_QUERY, { slug }),
    client.fetch(CATEGORY_POSTS_QUERY, { slug }),
    client.fetch(RELATED_CATEGORIES_QUERY, { slug })
  ])

  // If category doesn't exist, show 404
  if (!category) {
    notFound()
  }

  return (
    <div className="bg-white">
      {/* Compact Header Section */}
      <section className="bg-gray-50 pt-32 pb-12">
        <div className="content-container">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
            <Link href={`/${countryCode}/blog`} className="hover:text-blue-600">
              Blog
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-gray-900 font-medium">{category.title}</span>
          </nav>

          {/* Minimal Category Header */}
          <div className="flex items-center gap-6">
            {/* Small Category Image */}
            {category.image?.asset?.url && (
              <div className="flex-shrink-0">
                <img
                  src={category.image.asset.url}
                  alt={category.image.alt || category.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              </div>
            )}

            {/* Category Info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {category.title}
              </h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {category.description && (
                  <span className="line-clamp-1">{category.description}</span>
                )}
                <span className="text-gray-500">•</span>
                <span>{posts.length} {posts.length === 1 ? 'article' : 'articles'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Posts */}
      <section className="bg-white py-16">
        <div className="content-container">
          {posts && posts.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post: CategoryPost) => (
                <article 
                  key={post._id}
                  className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                >
                  {/* Post Image */}
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
                    {/* Category Badge (if post has multiple categories) */}
                    {post.categories && post.categories.length > 1 && (
                      <div className="mb-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          +{post.categories.length - 1} more categories
                        </span>
                      </div>
                    )}

                    {/* Title */}
                    <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                      <Link href={`/${countryCode}/blog/${post.slug.current}`}>
                        {post.title}
                      </Link>
                    </h2>

                    {/* Excerpt */}
                    {post.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div>
                        {post.author && (
                          <span>By {post.author.name}</span>
                        )}
                      </div>
                      <div>
                        {post.publishedAt && (
                          <time dateTime={post.publishedAt}>
                            {new Date(post.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </time>
                        )}
                      </div>
                    </div>

                    {/* Read More Link */}
                    <div className="mt-4">
                      <Link 
                        href={`/${countryCode}/blog/${post.slug.current}`}
                        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Read Article
                        <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            // Empty state
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No articles yet in {category.title}</h3>
              <p className="text-gray-600 mb-8">Check back soon for new content in this category.</p>
              <Link 
                href={`/${countryCode}/blog`}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Browse All Categories
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Related Categories */}
      {relatedCategories && relatedCategories.length > 0 && (
        <section className="bg-gray-50 py-16">
          <div className="content-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Explore Other Categories</h2>
              <p className="text-lg text-gray-600">
                Discover more industry-specific content and technical resources
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedCategories.slice(0, 6).map((relatedCategory: RelatedCategory) => (
                <Link
                  key={relatedCategory._id}
                  href={`/${countryCode}/blog/category/${relatedCategory.slug.current}`}
                  className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {relatedCategory.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {relatedCategory.postCount || 0} articles
                      </p>
                    </div>
                    <div className="text-gray-400 group-hover:text-blue-600 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
