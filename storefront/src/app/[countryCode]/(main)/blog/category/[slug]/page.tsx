import { client } from "../../../../../../sanity/lib/client"
import { groq } from "next-sanity"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Metadata } from "next"

interface Category {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  image?: { asset?: { _id: string; url: string }; alt?: string }
}

interface RelatedCategory {
  _id: string
  title: string
  slug: { current: string }
  postCount?: number
}

interface CategoryPost {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  mainImage?: { asset?: { _id: string; url: string }; alt?: string }
  author?: { name: string; slug: { current: string } }
  categories?: { title: string; slug: { current: string } }[]
}

const CATEGORY_QUERY = groq`
  *[_type == "category" && slug.current == $slug][0] {
    _id, title, slug, description,
    image{ asset->{ _id, url }, alt }
  }
`

const CATEGORY_POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current) && references(*[_type=="category" && slug.current == $slug]._id)] | order(publishedAt desc) {
    _id, title, slug, publishedAt, excerpt,
    mainImage{ asset->{ _id, url }, alt },
    author->{ name, slug },
    categories[]->{ title, slug }
  }
`

const RELATED_CATEGORIES_QUERY = groq`
  *[_type == "category" && slug.current != $slug] | order(title asc)[0...6] {
    _id, title, slug,
    "postCount": count(*[_type == "post" && references(^._id)])
  }
`

interface Props {
  params: { countryCode: string; slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params
  const category = await client.fetch(CATEGORY_QUERY, { slug })
  if (!category) return { title: "Category Not Found" }
  const postCount = await client.fetch<number>(
    groq`count(*[_type == "post" && references(*[_type=="category" && slug.current == $slug]._id)])`,
    { slug }
  )
  return {
    title: `${category.title} - Stainless Steel Resources | Cardinal Cooling Systems`,
    description: category.description
      ? `${category.description.slice(0, 140)}`
      : `Expert articles and guides about ${category.title.toLowerCase()} for stainless steel sanitary fittings. ${postCount} technical resources.`,
    alternates: {
      canonical: `https://cardinalcoolingsystems.com/us/blog/category/${slug}`,
    },
  }
}

export default async function CategoryArchivePage({ params }: Props) {
  const { countryCode, slug } = params
  const [category, posts, relatedCategories] = await Promise.all([
    client.fetch(CATEGORY_QUERY, { slug }),
    client.fetch(CATEGORY_POSTS_QUERY, { slug }),
    client.fetch(RELATED_CATEGORIES_QUERY, { slug }),
  ])

  if (!category) notFound()

  return (
    <div style={{ backgroundColor: "#0a0a0a" }}>

      {/* ── Hero — dark ──────────────────────────────────────────────────── */}
      <section className="pt-40 pb-16 px-6 lg:px-12" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto max-w-[1440px]">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-10" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href={`/${countryCode}`} className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${countryCode}/blog`} className="hover:text-white transition-colors">Blog</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>{category.title}</span>
          </nav>

          <div className="flex items-center gap-6">
            {category.image?.asset?.url && (
              <img
                src={category.image.asset.url}
                alt={category.image.alt || category.title}
                className="w-16 h-16 object-cover flex-shrink-0"
                style={{ borderRadius: "5px" }}
              />
            )}
            <div>
              <p className="text-xs font-normal tracking-widest uppercase mb-3" style={{ color: "#E3000F" }}>
                Category
              </p>
              <h1 className="font-sans text-4xl lg:text-5xl font-normal tracking-tight text-white mb-2">
                {category.title}
              </h1>
              <div className="flex items-center gap-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                {category.description && (
                  <span className="line-clamp-1 max-w-md">{category.description}</span>
                )}
                {category.description && <span>·</span>}
                <span>{posts.length} {posts.length === 1 ? "article" : "articles"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Posts — white ────────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 bg-white">
        <div className="mx-auto max-w-[1440px]">
          {posts && posts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post: CategoryPost) => (
                <article
                  key={post._id}
                  className="group bg-white border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                  style={{ borderRadius: "5px" }}
                >
                  {post.mainImage?.asset?.url && (
                    <div className="overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img
                        src={post.mainImage.asset.url}
                        alt={post.mainImage.alt || post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {post.categories && post.categories.length > 1 && (
                      <span
                        className="inline-block text-xs font-medium px-2.5 py-1 mb-3 w-fit"
                        style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
                      >
                        +{post.categories.length - 1} more
                      </span>
                    )}

                    <h2
                      className="text-base font-semibold leading-snug mb-2 line-clamp-2 transition-colors group-hover:text-red-600"
                      style={{ color: "#111111" }}
                    >
                      <Link href={`/${countryCode}/blog/${post.slug.current}`}>
                        {post.title}
                      </Link>
                    </h2>

                    {post.excerpt && (
                      <p className="text-sm font-light leading-relaxed line-clamp-3 mb-4 flex-1" style={{ color: "#6b7280" }}>
                        {post.excerpt}
                      </p>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      {post.author && (
                        <span className="text-xs" style={{ color: "#9ca3af" }}>By {post.author.name}</span>
                      )}
                      {post.publishedAt && (
                        <time dateTime={post.publishedAt} className="text-xs" style={{ color: "#9ca3af" }}>
                          {new Date(post.publishedAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </time>
                      )}
                    </div>

                    <Link
                      href={`/${countryCode}/blog/${post.slug.current}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium mt-3 transition-colors"
                      style={{ color: "#E3000F" }}
                    >
                      Read Article
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center">
              <p className="text-sm font-light mb-6" style={{ color: "#9ca3af" }}>
                No articles yet in {category.title}. Check back soon.
              </p>
              <Link
                href={`/${countryCode}/blog`}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-white"
                style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              >
                Browse All Categories
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Related categories — light gray ──────────────────────────────── */}
      {relatedCategories && relatedCategories.length > 0 && (
        <section className="py-20 px-6 lg:px-12" style={{ backgroundColor: "#f8f8f8" }}>
          <div className="mx-auto max-w-[1440px]">
            <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
              Explore More
            </p>
            <h2 className="font-sans text-3xl font-normal tracking-tight mb-12" style={{ color: "#111111" }}>
              Other categories
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {relatedCategories.slice(0, 6).map((rel: RelatedCategory) => (
                <Link
                  key={rel._id}
                  href={`/${countryCode}/blog/category/${rel.slug.current}`}
                  className="group bg-white border border-gray-100 p-6 flex items-center justify-between hover:shadow-md transition-all duration-300"
                  style={{ borderRadius: "5px" }}
                >
                  <div>
                    <h3
                      className="text-base font-semibold mb-1 transition-colors group-hover:text-red-600"
                      style={{ color: "#111111" }}
                    >
                      {rel.title}
                    </h3>
                    <p className="text-xs" style={{ color: "#9ca3af" }}>
                      {rel.postCount || 0} articles
                    </p>
                  </div>
                  <svg
                    className="w-4 h-4 flex-shrink-0 transition-colors group-hover:text-red-600"
                    style={{ color: "#9ca3af" }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  )
}
