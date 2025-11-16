"use client"

import { client } from "../../../../../../src/sanity/lib/client"
import { groq } from "next-sanity"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PortableText } from "next-sanity"
import type { Metadata } from "next"
import { useState, useRef } from "react"


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

type FormData = {
  name: string
  lastName: string
  email: string
  phone: string
  message: string
  agreeToTerms: boolean
}


// GROQ queries
const POST_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    publishedAt,
    body[]{
      ...,
      _type == "table" => {
        ...,
        rows[]{
          ...,
          cells[]
        }
      }
    },
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


// Contact Form Component
function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    lastName: "",
    email: "",
    phone: "",
    message: "",
    agreeToTerms: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const formRef = useRef<HTMLFormElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      agreeToTerms: e.target.checked
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-publishable-api-key': process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY!
        },
        body: JSON.stringify({
          name: formData.name,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          message: formData.message
        })
      })

      if (response.ok) {
        setSubmitStatus('success')
        setFormData({
          name: "",
          lastName: "",
          email: "",
          phone: "",
          message: "",
          agreeToTerms: false
        })
        formRef.current?.reset()
      } else {
        setSubmitStatus('error')
      }
    } catch (error) {
      console.error('Contact form error:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Heading */}
        <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 text-center mb-16">
          How Can We Help?
        </h2>

        {/* Success/Error Messages */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded text-green-800">
            Thank you! Your message has been sent successfully. We'll get back to you soon.
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
            Sorry, there was an error sending your message. Please try again.
          </div>
        )}

        {/* Contact Form */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
          {/* Row 1: Name and Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="First Name"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Last Name"
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Email and Phone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email address..."
                  required
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter your phone number..."
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Row 3: Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Message*
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Enter your message as clear as possible..."
                required
                rows={6}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Terms and Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center">
              <input
                id="agreeToTerms"
                name="agreeToTerms"
                type="checkbox"
                checked={formData.agreeToTerms}
                onChange={handleCheckboxChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 flex-shrink-0"
              />
              <label htmlFor="agreeToTerms" className="ml-3 block text-sm text-gray-700">
                I have agreed to the Terms & Conditions
              </label>
            </div>

            <button
              type="submit"
              disabled={!formData.agreeToTerms || isSubmitting}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isSubmitting ? 'Sending...' : 'Submit Form'}
              <svg 
                className="ml-3 w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M17 8l4 4m0 0l-4 4m4-4H3" 
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}


// Main Blog Post Page Component
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
        <div className="max-w-4xl mx-auto px-4">
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
        <div className="max-w-4xl mx-auto px-4 my-8 lg:my-16">
          <div className="grid gap-8">
            {/* Article Header */}
            <div>
              <div className="pb-4 grid gap-4 mb-6 border-b border-gray-100">
                {/* Categories */}
                {post.categories && post.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
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
                <div className="text-center">
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
                    {post.title}
                  </h1>
                </div>

                {/* Compact Author & Date */}
                <div className="text-center">
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
              <article className="gap-6 grid">
                {/* Featured Image */}
                {post.mainImage?.asset?.url && (
                  <div className="mx-auto w-full">
                    <img
                      src={post.mainImage.asset.url}
                      alt={post.mainImage.alt || post.title}
                      className="w-full h-auto rounded-lg"
                    />
                  </div>
                )}

                {/* Post Content */}
                {post.body?.length && (
                  <div className="mx-auto w-full">
                    <PortableText 
                      value={post.body}
                      components={{
                        types: {
                          table: ({value}) => (
                            <div className="my-8 overflow-x-auto">
                              <table className="min-w-full border-collapse border border-gray-300">
                                <tbody>
                                  {value.rows?.map((row: any, rowIndex: number) => (
                                    <tr key={rowIndex} className={rowIndex === 0 ? 'bg-gray-50' : ''}>
                                      {row.cells?.map((cell: any, cellIndex: number) => {
                                        const CellComponent = rowIndex === 0 ? 'th' : 'td';
                                        return (
                                          <CellComponent
                                            key={cellIndex}
                                            className={`border border-gray-300 px-4 py-2 ${rowIndex === 0 ? 'font-semibold text-left' : ''}`}
                                          >
                                            {cell}
                                          </CellComponent>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ),
                        },
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
          <div className="max-w-4xl mx-auto px-4 py-12 lg:py-16">
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
        </section>
      )}

      {/* Contact Form */}
      <ContactForm />

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
