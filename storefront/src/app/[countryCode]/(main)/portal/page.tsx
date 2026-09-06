import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

export async function generateMetadata({
  params: { countryCode },
}: {
  params: { countryCode: string }
}): Promise<Metadata> {
  return {
    title: "Buyer Portal — Order Stainless Parts in Two Minutes | Cardinal Cooling Systems",
    description:
      "Create a free company account and get your prices, live stock, one-page ordering, PO upload, and instant quotes for stainless tubing, fittings, and valves. 10% off your first order.",
    alternates: {
      canonical: `https://cardinalcoolingsystems.com/${countryCode}/portal`,
    },
  }
}

const benefitRows = [
  {
    eyebrow: "One-page ordering",
    title: "Search, price, stock — one table",
    copy: "Type a part number or description and see your price and live availability instantly. Add lines, set quantities, and order everything from a single page — no clicking through product pages one at a time.",
    image: "/portal/portal-quick-order.png",
    alt: "Portal dashboard with product search, prices, live stock levels, and a purchase-order drop zone",
    eager: true,
  },
  {
    eyebrow: "PO upload",
    title: "Drop in your purchase order — we fill the table",
    copy: "Upload a PO as a PDF or photo and the portal reads it, matches your part numbers against our catalog, and loads the lines into the order table. Anything we can't match rides along in your quote note so nothing gets dropped.",
    image: "/portal/portal-order-form.png",
    alt: "Order form with PO number and shipping address drawer filled from an uploaded purchase order",
    eager: false,
  },
  {
    eyebrow: "Order and quote together",
    title: "In-stock lines check out. The rest goes to quote.",
    copy: "Need more than we have on the shelf, or a part without a listed price? Payable lines go straight to checkout while quote-only lines are sent off as a quote request — one click, both handled.",
    image: "/portal/portal-mixed-cart.png",
    alt: "Mixed cart showing quote-only lines handled separately from the payable order total",
    eager: false,
  },
  {
    eyebrow: "Instant confirmation",
    title: "Order placed, quote sent — same screen",
    copy: "You get an order confirmation and a quote request receipt in one step. We follow up on quotes fast, and your order ships on the normal schedule — stock items in 1 business day.",
    image: "/portal/portal-confirmation.png",
    alt: "Confirmation screen showing an order placed and a quote request sent",
    eager: false,
  },
]

const steps = [
  {
    n: "1",
    title: "Create your account",
    copy: "Name, email, company, phone — that's it. Your company dashboard is ready the moment you sign up. No waiting for approval.",
  },
  {
    n: "2",
    title: "See your prices and stock",
    copy: "Standard catalog pricing and live inventory across our full range of stainless tubing, fittings, and valves.",
  },
  {
    n: "3",
    title: "Order or get a quote",
    copy: "Check out in-stock parts instantly, or send over-stock and unpriced lines as a quote request — from the same table.",
  },
]

function CtaButton({ countryCode, label }: { countryCode: string; label: string }) {
  return (
    <Link
      href={`/${countryCode}/account`}
      className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium w-fit text-white transition-colors duration-200 hover:bg-[#c0000d]"
      style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
    >
      {label}
      <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
        <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}

export default function PortalLandingPage({
  params: { countryCode },
}: {
  params: { countryCode: string }
}) {
  return (
    <div className="font-sans" style={{ backgroundColor: "#ffffff" }}>
      {/* ── Hero ── */}
      <section className="w-full pt-16 pb-12 lg:pt-24 lg:pb-16">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="max-w-3xl">
            <p
              className="text-xs font-normal tracking-widest uppercase mb-4"
              style={{ color: "#E3000F" }}
            >
              Cardinal Buyer Portal
            </p>
            <h1
              className="text-3xl lg:text-5xl font-normal tracking-tight leading-tight mb-6"
              style={{ color: "#111111" }}
            >
              Order stainless parts in two minutes — your prices, live stock, one page
            </h1>
            <p className="text-base lg:text-lg font-light leading-relaxed mb-8" style={{ color: "#555555" }}>
              A free company account gets you a dashboard built for repeat buyers: search the
              whole catalog with prices and stock on screen, upload a PO and let it fill the
              order for you, and send anything we can&apos;t ship today off as a quote — all
              without leaving one page.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <CtaButton countryCode={countryCode} label="Create your company account" />
              <p className="text-sm font-light" style={{ color: "#555555" }}>
                Includes <span className="font-semibold" style={{ color: "#111111" }}>10% off your first order</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefit rows ── */}
      <section className="w-full py-8 lg:py-12" style={{ backgroundColor: "#f8f8f8" }}>
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <div className="flex flex-col gap-16 lg:gap-24 py-8 lg:py-12">
            {benefitRows.map((row, i) => (
              <div
                key={row.title}
                className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center"
              >
                <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                  <p
                    className="text-xs font-normal tracking-widest uppercase mb-3"
                    style={{ color: "#E3000F" }}
                  >
                    {row.eyebrow}
                  </p>
                  <h2
                    className="text-xl lg:text-3xl font-normal tracking-tight mb-4"
                    style={{ color: "#111111" }}
                  >
                    {row.title}
                  </h2>
                  <p className="text-sm lg:text-base font-light leading-relaxed" style={{ color: "#555555" }}>
                    {row.copy}
                  </p>
                </div>
                <div
                  className={`overflow-hidden bg-white ${i % 2 === 1 ? "lg:order-1" : ""}`}
                  style={{ border: "1px solid rgba(227, 0, 15, 0.12)", borderRadius: "5px" }}
                >
                  <Image
                    src={row.image}
                    alt={row.alt}
                    width={1440}
                    height={1000}
                    loading={row.eager ? "eager" : "lazy"}
                    priority={row.eager}
                    sizes="(max-width: 1024px) 100vw, 640px"
                    className="w-full h-auto"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="w-full py-16 lg:py-24">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
          <p
            className="text-xs font-normal tracking-widest uppercase mb-3"
            style={{ color: "#E3000F" }}
          >
            How it works
          </p>
          <h2
            className="text-2xl lg:text-4xl font-normal tracking-tight mb-10 lg:mb-14 max-w-lg"
            style={{ color: "#111111" }}
          >
            Three steps, no phone tag
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {steps.map((step) => (
              <div
                key={step.n}
                className="flex flex-col gap-4 p-6 lg:p-8"
                style={{
                  backgroundColor: "#ffffff",
                  border: "1px solid rgba(227, 0, 15, 0.12)",
                  borderRadius: "5px",
                }}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-semibold"
                  style={{
                    backgroundColor: "rgba(227,0,15,0.08)",
                    color: "#E3000F",
                    borderRadius: "5px",
                  }}
                >
                  {step.n}
                </div>
                <h3 className="text-base font-semibold leading-snug" style={{ color: "#111111" }}>
                  {step.title}
                </h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#555555" }}>
                  {step.copy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Welcome offer + bottom CTA ── */}
      <section
        className="w-full py-16 lg:py-24"
        style={{ backgroundColor: "rgba(227, 0, 15, 0.06)" }}
      >
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 text-center">
          <p
            className="text-xs font-normal tracking-widest uppercase mb-4"
            style={{ color: "#E3000F" }}
          >
            Welcome offer
          </p>
          <h2
            className="text-2xl lg:text-4xl font-normal tracking-tight mb-4 mx-auto max-w-2xl"
            style={{ color: "#111111" }}
          >
            10% off your first order, on us
          </h2>
          <p
            className="text-sm lg:text-base font-light leading-relaxed mb-8 mx-auto max-w-xl"
            style={{ color: "#555555" }}
          >
            Every new company account gets a one-time 10% welcome code the moment it&apos;s
            created — shown on screen, ready to use on your first order.
          </p>
          <div className="flex justify-center">
            <CtaButton countryCode={countryCode} label="Create your company account" />
          </div>
          <p className="text-xs font-light mt-6" style={{ color: "#555555" }}>
            Free forever. No credit card to sign up. Stock orders ship in 1 business day.
          </p>
        </div>
      </section>
    </div>
  )
}
