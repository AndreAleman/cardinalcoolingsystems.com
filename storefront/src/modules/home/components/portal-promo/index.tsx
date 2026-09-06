import Image from "next/image"
import Link from "next/link"

const benefits = [
  {
    label: "Your prices and live stock on one page",
    description:
      "Search the catalog, see standard pricing and real-time availability side by side — no browsing product pages one at a time.",
  },
  {
    label: "Order or get a quote in one click",
    description:
      "In-stock lines check out instantly. Over-stock or unpriced lines go off as a quote request from the same table.",
  },
  {
    label: "Drop in a PO and the table fills itself",
    description:
      "Upload a purchase order PDF and we read it, match your part numbers, and load the lines — ready to order.",
  },
]

export default function PortalPromo({ countryCode }: { countryCode: string }) {
  return (
    <section className="w-full py-16 lg:py-24" style={{ backgroundColor: "#ffffff" }}>
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Copy */}
          <div>
            <p
              className="font-sans text-xs font-normal tracking-widest uppercase mb-3"
              style={{ color: "#E3000F" }}
            >
              Buyer Portal
            </p>
            <h2
              className="font-sans text-2xl lg:text-4xl font-normal tracking-tight mb-6"
              style={{ color: "#111111" }}
            >
              Order stainless parts in two minutes — free company account
            </h2>

            <ul className="flex flex-col gap-5 mb-8">
              {benefits.map((b) => (
                <li key={b.label} className="flex gap-4">
                  <span
                    className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center"
                    style={{
                      backgroundColor: "rgba(227,0,15,0.08)",
                      color: "#E3000F",
                      borderRadius: "5px",
                    }}
                    aria-hidden="true"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="font-sans text-base font-semibold leading-snug" style={{ color: "#111111" }}>
                      {b.label}
                    </h3>
                    <p className="font-sans text-sm font-light leading-relaxed mt-1" style={{ color: "#555555" }}>
                      {b.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Link
              href={`/${countryCode}/portal`}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium w-fit text-white transition-colors duration-200 hover:bg-[#c0000d]"
              style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
            >
              See how the portal works
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          {/* Screenshot */}
          <div
            className="overflow-hidden"
            style={{ border: "1px solid rgba(227, 0, 15, 0.12)", borderRadius: "5px" }}
          >
            <Image
              src="/portal/portal-quick-order.png"
              alt="Cardinal buyer portal quick-order dashboard showing product search, prices, live stock, and a purchase-order drop zone"
              width={1440}
              height={1000}
              loading="lazy"
              sizes="(max-width: 1024px) 100vw, 640px"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
