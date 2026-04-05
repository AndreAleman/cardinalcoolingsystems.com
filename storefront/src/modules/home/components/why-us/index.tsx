"use client"

import Link from "next/link"

const valueProps = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    label: "Ships in 1 Business Day",
    description: "Small orders out the door fast. Larger custom orders fulfilled in 6–10 weeks — faster than almost anyone else in the industry.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    label: "3A Certified 304 & 316L",
    description: "Every fitting meets 3A sanitary standards. We carry both 304 and 316L stainless — consistent grade, consistent dimensions, every order.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
    label: "American Support, Every Order",
    description: "Real people, based in the US. Custom quotes, custom parts, and technical support — no runaround, no overseas call centers.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Unbeatable Price & Speed",
    description: "When it comes to price and lead time, we can't be beat. Competitive pricing on every order, with volume discounts for repeat buyers.",
  },
]

export default function WhyUs() {
  return (
    <section
      className="relative w-full py-16 lg:py-24 overflow-hidden"
      style={{ backgroundColor: "rgba(227, 0, 15, 0.06)" }}
    >
      {/* SVG background — darker opacity */}
      <img
        src="/images/vector.svg"
        alt=""
        aria-hidden="true"
        className="absolute right-0 top-8 lg:top-0 h-full w-auto object-cover pointer-events-none select-none"
        style={{ opacity: 0.22, zIndex: 0 }}
      />

      <div className="relative z-10 mx-auto max-w-[1440px] px-6 lg:px-12">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 lg:mb-16">
          <div>
            <p
              className="font-sans text-xs font-normal tracking-widest uppercase mb-3"
              style={{ color: "#E3000F" }}
            >
              Why Cardinal Cooling
            </p>
            <h2
              className="font-sans text-2xl lg:text-4xl font-normal tracking-tight max-w-lg"
              style={{ color: "#111111" }}
            >
              Built for engineers who can't afford to wait
            </h2>
          </div>
          <Link
            href="/contact"
            className="flex items-center gap-2 px-6 py-3 text-sm font-medium w-fit transition-all duration-200 text-white"
            style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#c0000d")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = "#E3000F")}
          >
            Get a Custom Quote
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        {/* Value props — 1 col mobile, 2 col tablet, 4 col desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {valueProps.map((prop, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-4 p-6 lg:p-8"
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid rgba(227, 0, 15, 0.12)",
                borderRadius: "5px",
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: "rgba(227,0,15,0.08)",
                  color: "#E3000F",
                  borderRadius: "5px",
                }}
              >
                {prop.icon}
              </div>

              {/* Label */}
              <h3
                className="font-sans text-base font-semibold leading-snug"
                style={{ color: "#111111" }}
              >
                {prop.label}
              </h3>

              {/* Description */}
              <p
                className="font-sans text-sm font-light leading-relaxed"
                style={{ color: "#555555" }}
              >
                {prop.description}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
