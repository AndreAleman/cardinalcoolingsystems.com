import { getCategoriesList } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import NewsletterForm from "@modules/layout/components/newsletter-form"

export default async function Footer() {
  const { product_categories } = await getCategoriesList(0, 50)

  const parentCategories =
    product_categories?.filter(
      (c) => !c.parent_category && !c.parent_category_id
    ) || []

  const currentYear = new Date().getFullYear()

  return (
    <footer style={{ backgroundColor: "#0a0a0a" }} className="text-white w-full">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">

        {/* Main footer grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 py-16 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          {/* Company info + Logo */}
          <div className="lg:col-span-1">
            <LocalizedClientLink href="/" className="inline-block mb-4">
              <img
                src="/images/logo/new-cardinal-cooling-logo.svg"
                alt="Cardinal Cooling Systems"
                className="h-12 w-auto"
              />
            </LocalizedClientLink>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Premium stainless steel sanitary fittings for food processing,
              pharmaceuticals, brewing, and industrial applications. Quality you
              can trust.
            </p>
            <p className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
              Cardinal Cooling Systems LLC
            </p>
          </div>

          {/* Product Categories */}
          <div>
            <h3
              className="text-xs font-normal tracking-widest uppercase mb-5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Product Categories
            </h3>
            <ul className="space-y-3">
              {parentCategories.map((c) => (
                <li key={c.id}>
                  <LocalizedClientLink
                    href={`/categories/${c.handle}`}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                    data-testid="category-link"
                  >
                    {c.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3
              className="text-xs font-normal tracking-widest uppercase mb-5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Company
            </h3>
            <ul className="space-y-3">
              {[
                { label: "About Us", href: "/about" },
                { label: "Contact Us", href: "/contact" },
                { label: "Shipping & Returns", href: "/shipping-returns" },
                { label: "Terms of Service", href: "/terms-of-service" },
                { label: "Privacy Policy", href: "/privacy-policy" },
              ].map((item) => (
                <li key={item.href}>
                  <LocalizedClientLink
                    href={item.href}
                    className="text-sm transition-colors hover:text-white"
                    style={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {item.label}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info */}
          <div>
            <h3
              className="text-xs font-normal tracking-widest uppercase mb-5"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Contacts
            </h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-semibold text-white mb-1">Email:</p>
                <a
                  href="mailto:aleman@cardinalcoolingsystems.com"
                  className="transition-colors hover:text-white"
                  style={{ color: "#E3000F" }}
                >
                  aleman@cardinalcoolingsystems.com
                </a>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Phone:</p>
                <a
                  href="tel:+16309479955"
                  className="transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                >
                  (630) 947-9955
                </a>
              </div>
              <div>
                <p className="font-semibold text-white mb-1">Address:</p>
                <p style={{ color: "rgba(255,255,255,0.6)" }}>
                  333 S.E. 2nd Avenue, Suite 2000<br />
                  Miami, FL 33131<br />
                  United States
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Newsletter signup — email-capture / re-engagement hook */}
        <div
          className="py-10 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h3 className="text-base font-semibold text-white mb-1">
                Stay Updated
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                Product updates, lead-time news, and cooling-industry insights.
              </p>
            </div>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 py-8">

          {/* Payment icons */}
          <div className="flex items-center gap-3">
            <img src="/images/payments/visa.svg" alt="Visa" width={36} height={28} loading="lazy" decoding="async" className="h-7 w-auto" />
            <img src="/images/payments/mastercard.svg" alt="Mastercard" width={36} height={28} loading="lazy" decoding="async" className="h-7 w-auto" />
            <img src="/images/payments/amex.svg" alt="American Express" width={36} height={28} loading="lazy" decoding="async" className="h-7 w-auto" />
            <img src="/images/payments/discover.svg" alt="Discover" width={36} height={28} loading="lazy" decoding="async" className="h-7 w-auto" />
          </div>

          {/* SSL */}
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Secure SSL Encrypted Checkout
          </div>

          {/* Copyright + links */}
          <div
            className="flex flex-wrap items-center gap-4 text-xs"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            <LocalizedClientLink href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy Policy
            </LocalizedClientLink>
            <LocalizedClientLink href="/terms-of-service" className="hover:text-white transition-colors">
              Terms of Service
            </LocalizedClientLink>
            <span>© {currentYear} Cardinal Cooling Systems. All rights reserved.</span>
          </div>

        </div>
      </div>
    </footer>
  )
}
