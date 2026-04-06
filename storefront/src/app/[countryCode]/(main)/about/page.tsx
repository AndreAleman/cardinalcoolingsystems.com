import { Metadata } from "next"
import Link from "next/link"

interface Props {
  params: { countryCode: string }
}

export const metadata: Metadata = {
  title: "About Us | Cardinal Cooling Systems",
  description: "Learn about Cardinal Cooling Systems's commitment to providing premium sanitary stainless steel fittings for food processing, pharmaceuticals, and industrial applications.",
}

const values = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    title: "Quality First",
    description: "Every product meets the highest industry standards for sanitary applications. We never compromise on quality or safety.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
      </svg>
    ),
    title: "Technical Expertise",
    description: "Deep knowledge of sanitary fitting applications across food processing, pharmaceuticals, and industrial environments.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    title: "American Support",
    description: "Responsive US-based support and technical guidance to help you find the right solution for your specific application needs.",
  },
]

const industries = [
  { name: "Food Processing", desc: "Sanitary fittings for dairy, beverage, and food production facilities." },
  { name: "Pharmaceuticals", desc: "High-purity components for pharmaceutical and biotech manufacturing." },
  { name: "Brewing & Beverage", desc: "Specialized fittings for breweries and beverage production lines." },
  { name: "Industrial Cooling", desc: "Heavy-duty stainless components for data centers and process cooling." },
]

export default function AboutPage({ params }: Props) {
  const { countryCode } = params

  return (
    <div>

      {/* ── Hero — dark ──────────────────────────────────────────────────── */}
      <section className="pt-40 pb-20 px-6 lg:px-12" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto max-w-[1440px]">
          <nav className="flex items-center gap-2 text-sm mb-10" style={{ color: "rgba(255,255,255,0.35)" }}>
            <Link href={`/${countryCode}`} className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>About Us</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
                Our Story
              </p>
              <h1 className="font-sans text-4xl lg:text-6xl font-normal tracking-tight text-white leading-tight mb-6">
                Premium Quality,<br />Trusted Reliability
              </h1>
              <p className="text-base font-light leading-relaxed max-w-md" style={{ color: "rgba(255,255,255,0.55)" }}>
                Cardinal Cooling Systems was built to serve engineers who need reliable, certified stainless steel components — fast, at the right price, from people who know the product.
              </p>
            </div>

            {/* Hero image */}
            <div className="relative h-80 lg:h-96 overflow-hidden" style={{ borderRadius: "5px" }}>
              <img
                src="/images/about/about-main.jpg"
                alt="Cardinal Cooling Systems"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.8)" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Our Story — white ────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 bg-white">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
                Who We Are
              </p>
              <h2 className="font-sans text-3xl lg:text-4xl font-normal tracking-tight mb-6" style={{ color: "#111111" }}>
                Built for engineers who can't afford to wait
              </h2>
            </div>
            <div className="space-y-4 text-sm font-light leading-relaxed" style={{ color: "#555555" }}>
              <p>
                Founded with a mission to provide superior sanitary stainless steel solutions, Cardinal Cooling Systems has grown from a small specialty supplier to a trusted partner for industries where precision and cleanliness are paramount.
              </p>
              <p>
                Our journey began when we recognized the need for reliable, high-quality sanitary fittings that could meet the demanding standards of food processing, pharmaceutical manufacturing, and data center cooling. Today, we serve clients across diverse industries with the same commitment to excellence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Values — light red tint ───────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12" style={{ backgroundColor: "rgba(227, 0, 15, 0.04)" }}>
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
            Our Values
          </p>
          <h2 className="font-sans text-3xl font-normal tracking-tight mb-12" style={{ color: "#111111" }}>
            What we stand for
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, idx) => (
              <div
                key={idx}
                className="p-8 flex flex-col gap-4 bg-white"
                style={{ border: "1px solid rgba(227,0,15,0.10)", borderRadius: "5px" }}
              >
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
                >
                  {v.icon}
                </div>
                <h3 className="text-base font-semibold" style={{ color: "#111111" }}>{v.title}</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#555555" }}>{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Industries — white ───────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12 bg-white">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
            Industries
          </p>
          <h2 className="font-sans text-3xl font-normal tracking-tight mb-12" style={{ color: "#111111" }}>
            Industries we serve
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {industries.map((ind, idx) => (
              <div
                key={idx}
                className="p-6 flex flex-col gap-3"
                style={{ backgroundColor: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "5px" }}
              >
                <div
                  className="w-8 h-8 flex items-center justify-center"
                  style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold" style={{ color: "#111111" }}>{ind.name}</h3>
                <p className="text-xs font-light leading-relaxed" style={{ color: "#6b7280" }}>{ind.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — dark ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 lg:px-12" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div>
              <h2 className="font-sans text-3xl lg:text-4xl font-normal tracking-tight text-white mb-3">
                Ready to work with us?
              </h2>
              <p className="text-sm font-light" style={{ color: "rgba(255,255,255,0.5)" }}>
                Get in touch to discuss your requirements. Our team responds within one business day.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <Link
                href={`/${countryCode}/contact`}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all duration-200"
                style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              >
                Contact Us
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <Link
                href={`/${countryCode}/store`}
                className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-white transition-all duration-200"
                style={{ border: "1px solid rgba(255,255,255,0.2)", borderRadius: "5px" }}
              >
                Browse Products
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
