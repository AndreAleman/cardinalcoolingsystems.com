import { client } from "../../../../../src/sanity/lib/client"
import { groq } from "next-sanity"
import Link from "next/link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Technical Resources & Industry Insights | Cardinal Cooling Systems Blog",
  description:
    "Expert articles on stainless steel sanitary fittings, tubing, and valves. Industry guides for data centers, HVAC, food processing, and pharmaceutical applications.",
  alternates: {
    canonical: "https://www.cardinalcoolingsystems.com/us/blog",
  },
}

interface Category {
  _id: string
  title: string
  slug: { current: string }
  description?: string
  image?: { asset?: { _id: string; url: string }; alt?: string }
  postCount?: number
}

interface RecentPost {
  _id: string
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  mainImage?: { asset?: { _id: string; url: string }; alt?: string }
  categories?: Category[]
}

const CATEGORIES_QUERY = groq`
  *[_type == "category"] | order(title asc) {
    _id, title, slug, description,
    image{ asset->{ _id, url }, alt },
    "postCount": count(*[_type == "post" && references(^._id)])
  }
`

const RECENT_POSTS_QUERY = groq`
  *[_type == "post" && defined(slug.current)] | order(publishedAt desc)[0...6] {
    _id, title, slug, publishedAt, excerpt,
    mainImage{ asset->{ _id, url }, alt },
    categories[]->{ title, slug }
  }
`

export default async function BlogCategoriesPage({ params }: { params: { countryCode: string } }) {
  const [categories, recentPosts] = await Promise.all([
    client.fetch(CATEGORIES_QUERY),
    client.fetch(RECENT_POSTS_QUERY),
  ])

  const { countryCode } = params

  return (
    <div style={{ backgroundColor: "#0a0a0a" }}>

      {/* ── Hero — dark ──────────────────────────────────────────────────── */}
      <section className="pt-40 pb-20 px-6 lg:px-12" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto max-w-[1440px]">
          <nav className="flex items-center gap-2 text-sm mb-10" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href={`/${countryCode}`} className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>Blog</span>
          </nav>

          <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
            Resources
          </p>
          <h1 className="font-sans text-4xl lg:text-6xl font-normal tracking-tight text-white leading-tight mb-6 max-w-3xl">
            Industry Expertise &amp; Technical Resources
          </h1>
          <p className="text-base font-light leading-relaxed max-w-xl" style={{ color: "rgba(255,255,255,0.5)" }}>
            Expert guidance on sanitary fittings, industry applications, and technical best practices
            for data centers, food processing, pharmaceuticals, and industrial operations.
          </p>
        </div>
      </section>

      {/* ── Categories — white ───────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 bg-white">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
            Browse by Category
          </p>
          <h2 className="font-sans text-3xl font-normal tracking-tight mb-12" style={{ color: "#111111" }}>
            Find content for your industry
          </h2>

          {categories && categories.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map((category: Category) => (
                <Link
                  key={category._id}
                  href={`/${countryCode}/blog/category/${category.slug.current}`}
                  className="group overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 bg-white flex flex-col"
                  style={{ borderRadius: "5px" }}
                >
                  {category.image?.asset?.url && (
                    <div className="overflow-hidden" style={{ aspectRatio: "16/9" }}>
                      <img
                        src={category.image.asset.url}
                        alt={category.image.alt || category.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-6 flex items-start justify-between flex-1">
                    <div className="flex-1">
                      <h3
                        className="text-base font-semibold mb-2 transition-colors group-hover:text-red-600"
                        style={{ color: "#111111" }}
                      >
                        {category.title}
                      </h3>
                      {category.description && (
                        <p className="text-sm font-light leading-relaxed mb-3" style={{ color: "#6b7280" }}>
                          {category.description}
                        </p>
                      )}
                      {category.postCount !== undefined && (
                        <p className="text-xs" style={{ color: "#9ca3af" }}>
                          {category.postCount} {category.postCount === 1 ? "article" : "articles"}
                        </p>
                      )}
                    </div>
                    <svg
                      className="w-4 h-4 ml-4 mt-0.5 flex-shrink-0 transition-colors group-hover:text-red-600"
                      style={{ color: "#9ca3af" }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-sm font-light" style={{ color: "#9ca3af" }}>
                Categories will appear here once created in your Studio.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Recent Posts — light gray ─────────────────────────────────────── */}
      {recentPosts && recentPosts.length > 0 && (
        <section className="py-20 px-6 lg:px-12" style={{ backgroundColor: "#f8f8f8" }}>
          <div className="mx-auto max-w-[1440px]">
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
                  Latest
                </p>
                <h2 className="font-sans text-3xl font-normal tracking-tight" style={{ color: "#111111" }}>
                  Recent articles
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentPosts.slice(0, 6).map((post: RecentPost) => (
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
                    {post.categories && post.categories.length > 0 && (
                      <span
                        className="inline-block text-xs font-medium px-2.5 py-1 mb-3 w-fit"
                        style={{
                          backgroundColor: "rgba(227,0,15,0.08)",
                          color: "#E3000F",
                          borderRadius: "5px",
                        }}
                      >
                        {post.categories[0].title}
                      </span>
                    )}

                    <h3 className="text-base font-semibold leading-snug mb-2 line-clamp-2 transition-colors group-hover:text-red-600" style={{ color: "#111111" }}>
                      <Link href={`/${countryCode}/blog/${post.slug.current}`}>
                        {post.title}
                      </Link>
                    </h3>

                    {post.excerpt && (
                      <p className="text-sm font-light leading-relaxed line-clamp-2 mb-4 flex-1" style={{ color: "#6b7280" }}>
                        {post.excerpt}
                      </p>
                    )}

                    {post.publishedAt && (
                      <time
                        dateTime={post.publishedAt}
                        className="text-xs mt-auto"
                        style={{ color: "#9ca3af" }}
                      >
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </time>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Mobile view all */}

          </div>
        </section>
      )}

    </div>
  )
}
