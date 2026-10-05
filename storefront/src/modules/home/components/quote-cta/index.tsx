import LocalizedClientLink from "@modules/common/components/localized-client-link"

const PHONE = "(630) 947-9955"
const PHONE_HREF = "tel:+16309479955"
const EMAIL = "sales@cardinalcoolingsystems.com"

// Replaces the homepage RFQ form, which produced no submissions in 90 days.
// Every lead the site has taken came through /contact, so this sends buyers there.
export default function QuoteCta() {
  return (
    <section style={{ backgroundColor: "#0a0a0a" }} className="w-full">
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-10">
          <div className="max-w-2xl">
            <p className="text-xs font-normal tracking-widest uppercase mb-4" style={{ color: "#E3000F" }}>
              Request a quote
            </p>
            <h2 className="font-sans text-3xl lg:text-5xl font-normal tracking-tight text-white leading-tight mb-5">
              Send us your parts list. We quote the same business day.
            </h2>
            <p className="text-base lg:text-lg font-light leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              Part numbers, a BOM, or a drawing — 304 and 316L sanitary tube, fittings and valves,
              stocked for data center liquid cooling and food processing loops.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:items-end">
            <LocalizedClientLink
              href="/contact"
              className="inline-flex items-center justify-center h-12 px-8 text-sm font-semibold text-white transition-colors duration-150"
              style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              data-testid="home-request-quote-link"
            >
              Request a quote
            </LocalizedClientLink>
            <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 text-sm lg:text-right" style={{ color: "rgba(255,255,255,0.7)" }}>
              <a href={PHONE_HREF} className="hover:text-white transition-colors">{PHONE}</a>
              <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">{EMAIL}</a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
