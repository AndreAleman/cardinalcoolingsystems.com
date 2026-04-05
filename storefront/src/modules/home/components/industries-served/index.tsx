"use client"

import Link from "next/link"

const BRAND_RED = "#E3000F"

const industries = [
  {
    id: "data-centers",
    name: "Data Centers",
    description:
      "High-flow liquid cooling loops and heat exchanger manifolds for hyperscale and edge facilities.",
    featured: true,
  },
  {
    id: "food-beverage",
    name: "Food & Beverage",
    description:
      "FDA-compliant sanitary fittings keeping production lines hygienic from mixing to packaging.",
    featured: false,
  },
  {
    id: "pharmaceutical",
    name: "Pharmaceutical",
    description:
      "Ultra-pure 316L systems for WFI distribution, CIP/SIP circuits, and sterile processing.",
    featured: false,
  },
  {
    id: "hvac-industrial",
    name: "HVAC & Industrial",
    description:
      "Corrosion-resistant tubing for refrigerant lines, chilled water circuits, and process piping.",
    featured: false,
  },
  {
    id: "brewing-dairy",
    name: "Brewing & Dairy",
    description:
      "Electropolished fittings and tri-clamp tubing across fermenters, pasteurisers, and transfer lines.",
    featured: false,
  },
]

export default function IndustriesServed() {
  return (
    <section
      className="relative min-h-[680px] flex flex-col justify-end overflow-hidden"
      style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/images/industries/data-center-hero.jpg"
          alt="Data center with stainless steel cooling pipes"
          className="w-full h-full object-cover object-center"
          onError={(e) => {
            const el = e.currentTarget.parentElement as HTMLDivElement
            el.style.background =
              "linear-gradient(135deg, #0a0a0a 0%, #1a0505 50%, #0a0a0a 100%)"
            e.currentTarget.style.display = "none"
          }}
        />
      </div>

      {/* Layered overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, #0a0a0a 0%, #0a0a0a 20%, rgba(10,10,10,0.88) 45%, rgba(10,10,10,0.4) 70%, rgba(10,10,10,0.15) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(10,10,10,0.6) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(227,0,15,0.07) 0%, transparent 100%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16 pt-32">

        {/* Label + heading */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span
              className="inline-block h-px w-6"
              style={{ backgroundColor: BRAND_RED }}
            />
            <span
              className="text-xs font-semibold tracking-[0.22em] uppercase"
              style={{ color: BRAND_RED }}
            >
              Industries Served
            </span>
          </div>

          <h2
            className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight"
            style={{ color: "#ffffff" }}
          >
            Precision tubing for the industries
            <br className="hidden sm:block" /> that demand it most.
          </h2>
        </div>

        {/* Industry list */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
        >
          {industries.map((industry, i) => (
            <div
              key={industry.id}
              className="group relative py-6 pr-4 transition-all duration-300"
            >
              {/* Hover red line at top */}
              <div
                className="absolute top-0 left-0 right-0 h-px transition-all duration-300 opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: BRAND_RED }}
              />

              {/* Index */}
              <span
                className="block text-xs font-mono mb-3 tabular-nums"
                style={{ color: "rgba(227,0,15,0.5)" }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              {/* Name */}
              <h3
                className="text-sm font-semibold mb-2 leading-snug transition-colors duration-200 group-hover:text-white"
                style={{
                  color: industry.featured ? "#ffffff" : "rgba(255,255,255,0.75)",
                }}
              >
                {industry.name}
                {industry.featured && (
                  <span
                    className="ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded align-middle"
                    style={{
                      backgroundColor: "rgba(227,0,15,0.15)",
                      color: BRAND_RED,
                      border: `1px solid rgba(227,0,15,0.25)`,
                    }}
                  >
                    Featured
                  </span>
                )}
              </h3>

              {/* Description */}
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(255,255,255,0.42)" }}
              >
                {industry.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer row */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Not seeing your industry?{" "}
            <Link
              href="/contact"
              className="underline underline-offset-2 transition-colors duration-200"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color = "#ffffff")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.55)")
              }
            >
              Get in touch
            </Link>{" "}
            — we supply a wide range of process industries.
          </p>

          <Link
            href="/industries"
            className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide uppercase transition-all duration-200 whitespace-nowrap"
            style={{ color: BRAND_RED }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "0.75")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.opacity = "1")
            }
          >
            View all industries
            <svg
              className="w-3.5 h-3.5"
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
          </Link>
        </div>
      </div>
    </section>
  )
}
