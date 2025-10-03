import { client } from "../../../../../../src/sanity/lib/client"
import { groq } from "next-sanity"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PortableText } from "next-sanity"
import type { Metadata } from "next"

// Type definitions
interface BlogPost {
  _id: string
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  body: any[]
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
    bio?: string
    image?: {
      asset?: {
        url: string
      }
      alt?: string
    }
  }
  categories?: {
    title: string
    slug: {
      current: string
    }
  }[]
}

interface PostCategory {
  title: string
  slug: {
    current: string
  }
}

interface RelatedPost {
  _id: string
  title: string
  slug: {
    current: string
  }
  publishedAt: string
  excerpt?: string
  mainImage?: {
    asset?: {
      url: string
    }
    alt?: string
  }
}

// GROQ queries
const POST_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    body,
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
      slug,
      bio,
      image{
        asset->{
          url
        },
        alt
      }
    },
    categories[]->{
      title,
      slug
    }
  }
`

const RELATED_POSTS_QUERY = groq`
  *[_type == "post" && slug.current != $slug && count(categories[@._ref in ^.^.categories[]._ref]) > 0] | order(publishedAt desc)[0...3] {
    _id,
    title,
    slug,
    publishedAt,
    excerpt,
    mainImage{
      asset->{
        url
      },
      alt
    }
  }
`

interface Props {
  params: { countryCode: string; slug: string }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await client.fetch(POST_QUERY, { slug: params.slug })

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: `${post.title} | Blog`,
    description: post.excerpt || `Read ${post.title} on our technical blog`,
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read ${post.title} on our technical blog`,
      images: post.mainImage?.asset?.url ? [post.mainImage.asset.url] : [],
      type: 'article',
      publishedTime: post.publishedAt,
      authors: post.author?.name ? [post.author.name] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Read ${post.title} on our technical blog`,
      images: post.mainImage?.asset?.url ? [post.mainImage.asset.url] : [],
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { countryCode, slug } = params

  const [post, relatedPosts] = await Promise.all([
    client.fetch(POST_QUERY, { slug }),
    client.fetch(RELATED_POSTS_QUERY, { slug })
  ])

  // If post doesn't exist, show 404
  if (!post) {
    notFound()
  }

  return (
    <div className="bg-white">
      {/* Breadcrumb */}
      <section className="bg-gray-50 pt-32 pb-6">
        <div className="content-container">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href={`/${countryCode}/blog`} className="hover:text-blue-600">
              Blog
            </Link>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {post.categories && post.categories.length > 0 && (
              <>
                <Link 
                  href={`/${countryCode}/blog/category/${post.categories[0].slug.current}`}
                  className="hover:text-blue-600"
                >
                  {post.categories[0].title}
                </Link>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </>
            )}
            <span className="text-gray-900 font-medium line-clamp-1">{post.title}</span>
          </nav>
        </div>
      </section>

      {/* Article */}
      <article className="bg-white">
        <div className="content-container my-8 lg:my-16">
          <div className="grid gap-8">
            {/* Article Header */}
            <div>
              <div className="pb-4 grid gap-4 mb-6 border-b border-gray-100">
                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {post.categories.map((category: PostCategory) => (
                      <Link
                        key={category.slug.current}
                        href={`/${countryCode}/blog/category/${category.slug.current}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                      >
                        {category.title}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Title */}
                <div className="max-w-3xl">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                    {post.title}
                  </h1>
                </div>

                {/* Compact Author & Date */}
                <div className="max-w-3xl">
                  <div className="text-sm text-gray-600">
                    {post.author?.name && (
                      <span>By {post.author.name}</span>
                    )}
                    {post.author?.name && post.publishedAt && <span> • </span>}
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
              </div>

              {/* Article Content */}
              <article className="gap-6 grid max-w-4xl">
                {/* Smaller Featured Image (30% reduction) */}
                {post.mainImage?.asset?.url && (
                  <div className="max-w-3xl">
                    <img
                      src={post.mainImage.asset.url}
                      alt={post.mainImage.alt || post.title}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                {/* Post Content */}
                {post.body?.length && (
                  <div className="max-w-2xl">
                    <PortableText 
                      value={post.body}
                      components={{
                        block: {
                          normal: ({children}) => <p className="mb-6 leading-relaxed text-gray-700">{children}</p>,
                          h2: ({children}) => <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-6">{children}</h2>,
                          h3: ({children}) => <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">{children}</h3>,
                          h4: ({children}) => <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-3">{children}</h4>,
                          blockquote: ({children}) => <blockquote className="border-l-4 border-blue-500 pl-6 my-8 italic text-gray-600">{children}</blockquote>,
                        },
                        list: {
                          bullet: ({children}) => <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">{children}</ul>,
                          number: ({children}) => <ol className="list-decimal list-inside mb-6 space-y-2 text-gray-700">{children}</ol>,
                        },
                        listItem: {
                          bullet: ({children}) => <li className="leading-relaxed">{children}</li>,
                          number: ({children}) => <li className="leading-relaxed">{children}</li>,
                        },
                        marks: {
                          strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                          em: ({children}) => <em className="italic">{children}</em>,
                          code: ({children}) => <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>,
                          link: ({children, value}) => (
                            <a 
                              href={value?.href} 
                              className="text-blue-600 hover:text-blue-700 underline"
                              target={value?.blank ? "_blank" : undefined}
                              rel={value?.blank ? "noopener noreferrer" : undefined}
                            >
                              {children}
                            </a>
                          ),
                        },
                      }}
                    />
                  </div>
                )}
              </article>
            </div>
          </div>
        </div>
      </article>

      {/* Author Bio */}
      {post.author?.bio && (
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="content-container py-12 lg:py-16">
            <div className="max-w-2xl">
              <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
                <div className="flex items-start gap-6">
                  {post.author.image?.asset?.url && (
                    <div className="flex-shrink-0">
                      <img
                        src={post.author.image.asset.url}
                        alt={post.author.image.alt || post.author.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      About {post.author.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {post.author.bio}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="border-t border-gray-100 bg-gray-50">
          <div className="content-container py-12 lg:py-24">
            <div className="grid gap-12">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Related Articles</h2>
                <p className="text-lg text-gray-600">
                  Continue reading more technical insights and industry guidance
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
                {relatedPosts.map((relatedPost: RelatedPost) => (
                  <article 
                    key={relatedPost._id}
                    className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    {/* Related Post Image */}
                    {relatedPost.mainImage?.asset?.url && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={relatedPost.mainImage.asset.url}
                          alt={relatedPost.mainImage.alt || relatedPost.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                        <Link href={`/${countryCode}/blog/${relatedPost.slug.current}`}>
                          {relatedPost.title}
                        </Link>
                      </h3>

                      {/* Excerpt */}
                      {relatedPost.excerpt && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {relatedPost.excerpt}
                        </p>
                      )}

                      {/* Date */}
                      <div className="text-xs text-gray-500">
                        {relatedPost.publishedAt && (
                          <time dateTime={relatedPost.publishedAt}>
                            {new Date(relatedPost.publishedAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </time>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
