import { Metadata } from "next"
import Link from "next/link"
import { getProductByHandle } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import {
  STAINLESS_TUBE_PRODUCT_HANDLE,
  STAINLESS_TUBE_QUOTE_ANCHOR,
  tubeSizeRows,
  tubeVariantOptions,
} from "@lib/stainless-tube"
import TubeQuoteForm from "@modules/stainless-tube/components/tube-quote-form"

/*
  Stainless sanitary tube / pipe landing page. Server-rendered: the size
  table comes from the polished tube product's variants in Medusa, so it
  stays in sync with the catalog. Tube is priced per order (Quote-Only),
  so the page sells the quote, not a price. Facts on this page are the
  owner-approved list only — do not add lead times or price claims.
*/

type Props = {
  params: { countryCode: string }
}

const MTR_LOOKUP_URL = "https://sanitube.us/mtr-generator"

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: "Stainless Steel Tubing & Pipe | Sanitary 304L & 316L | Cardinal Cooling Systems",
    description:
      "Sanitary stainless steel tubing and pipe in 304L and 316L, ASTM A270 3-A polished, 1-1/2\" to 12\" OD. Quote only: pricing in 48 hours, quotes held 90 days, no minimums, MTRs for every part.",
    alternates: {
      canonical: `https://cardinalcoolingsystems.com/${params.countryCode}/stainless-steel-tubing`,
    },
  }
}

const facts = [
  { title: "Pricing in 48 hours", detail: "Send sizes and quantities; your quote comes back within 48 hours." },
  { title: "Quotes held 90 days", detail: "Your price holds for 90 days, so you can plan the build and the PO." },
  { title: "No minimums", detail: "Quote a few lengths or a full project, same process." },
  { title: "Ships from FL, KC and LA", detail: "Stock ships from our Florida, Kansas City and Los Angeles warehouses." },
  { title: "MTRs for every part", detail: "Mill test reports are available for every part we ship." },
  { title: "Same-day vendor setup", detail: "Send your vendor forms and we set you up the same day." },
]

const faqs = [
  {
    q: "Is it stainless steel tubing or stainless steel pipe?",
    a: "Sanitary tubing is sized by its actual outside diameter (OD) and wall thickness, for example 2\" OD × 0.065\" wall. Many buyers call it stainless steel pipe; if you have a pipe spec, send it with your request and we will quote the matching tube.",
  },
  {
    q: "304L or 316L?",
    a: "Both are low-carbon grades suited to welding. 316L adds molybdenum for better resistance to chlorides and many cleaning chemicals. 304L is common where that exposure is low. Tell us your fluid and we will quote either or both.",
  },
  {
    q: "Why is there no price on the site?",
    a: "Tube is priced per order on size mix and quantity, so every order is quoted. You get pricing within 48 hours and the quote holds for 90 days.",
  },
  {
    q: "Can I get MTRs?",
    a: "Yes. MTRs are available for every part, and you can look one up with the MTR lookup tool.",
  },
]

export default async function StainlessSteelTubingPage({ params }: Props) {
  const { countryCode } = params

  let product = null
  try {
    const region = await getRegion(countryCode)
    if (region) product = (await getProductByHandle(STAINLESS_TUBE_PRODUCT_HANDLE, region.id)) ?? null
  } catch {
    product = null
  }

  const options = tubeVariantOptions(product)
  const { rows, alloys } = tubeSizeRows(options)

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="pt-36 pb-16 px-6 lg:px-12 bg-white">
        <div className="mx-auto max-w-[1440px]">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm mb-10" style={{ color: "#9ca3af" }}>
            <Link href={`/${countryCode}`} className="hover:text-gray-900 transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/${countryCode}/categories/tubes`} className="hover:text-gray-900 transition-colors">Tubes</Link>
            <span>/</span>
            <span className="text-gray-900">Stainless Steel Tubing &amp; Pipe</span>
          </nav>

          <p className="text-xs font-medium tracking-[0.18em] uppercase mb-4" style={{ color: "#E3000F" }}>
            Sanitary tubing · 304L &amp; 316L · Quote only
          </p>
          <h1 className="font-sans text-4xl lg:text-6xl font-normal tracking-tight mb-6 max-w-4xl" style={{ color: "#111111" }}>
            Stainless Steel Tubing &amp; Pipe
          </h1>
          <p className="text-base font-light leading-relaxed max-w-2xl mb-8" style={{ color: "#4b5563" }}>
            Polished sanitary tubing to ASTM A270 3-A, ID and OD polished, in 304L and 316L
            {rows.length > 0 && <> from {rows[0].od} to {rows[rows.length - 1].od} OD</>}.
            Tube is priced per order: send your sizes and quantities and get pricing back within 48 hours.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={`#${STAINLESS_TUBE_QUOTE_ANCHOR}`}
              className="inline-flex items-center px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
            >
              Request a quote
            </a>
            <a
              href="#sizes"
              className="inline-flex items-center px-6 py-3 text-sm font-medium border border-gray-200 transition-colors hover:border-gray-400"
              style={{ color: "#111111", borderRadius: "5px" }}
            >
              See sizes
            </a>
          </div>
        </div>
      </section>

      {/* ── Facts ────────────────────────────────────────────────────── */}
      <section className="py-14 px-6 lg:px-12 border-t" style={{ borderColor: "#f0f0f0", backgroundColor: "#fafafa" }}>
        <div className="mx-auto max-w-[1440px]">
          <h2 className="sr-only">How quoting works</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {facts.map((f) => (
              <li key={f.title} className="p-6 bg-white" style={{ border: "1px solid #f0f0f0", borderRadius: "5px" }}>
                <p className="text-sm font-semibold mb-1" style={{ color: "#111111" }}>{f.title}</p>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#6b7280" }}>
                  {f.detail}
                  {f.title === "MTRs for every part" && (
                    <>
                      {" "}
                      <a href={MTR_LOOKUP_URL} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#E3000F" }}>
                        Look up an MTR
                      </a>
                    </>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Size / alloy table ───────────────────────────────────────── */}
      <section id="sizes" className="py-16 px-6 lg:px-12 scroll-mt-28">
        <div className="mx-auto max-w-[1440px]">
          <h2 className="font-sans text-3xl font-normal tracking-tight mb-3" style={{ color: "#111111" }}>
            Sanitary tubing sizes, alloys and walls
          </h2>
          <p className="text-sm font-light mb-8 max-w-2xl" style={{ color: "#6b7280" }}>
            ASTM A270 3-A polished tube, ID/OD polished. Part numbers by OD, wall and alloy. Need a size that is not listed? Add it to your quote request.
          </p>

          {rows.length > 0 ? (
            <div className="overflow-x-auto border border-gray-100" style={{ borderRadius: "5px" }}>
              <table className="w-full text-sm text-left">
                <thead style={{ backgroundColor: "#fafafa" }}>
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold" style={{ color: "#111111" }}>Tube OD</th>
                    <th scope="col" className="px-4 py-3 font-semibold" style={{ color: "#111111" }}>Wall</th>
                    {alloys.map((a) => (
                      <th key={a} scope="col" className="px-4 py-3 font-semibold" style={{ color: "#111111" }}>{a}</th>
                    ))}
                    <th scope="col" className="px-4 py-3 font-semibold" style={{ color: "#111111" }}>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.od}-${r.wall}`} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium" style={{ color: "#111111" }}>{r.od}</td>
                      <td className="px-4 py-3" style={{ color: "#374151" }}>{r.wall}</td>
                      {alloys.map((a) => (
                        <td key={a} className="px-4 py-3 font-mono text-xs" style={{ color: r.skus[a] ? "#374151" : "#d1d5db" }}>
                          {r.skus[a] ?? "—"}
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <a href={`#${STAINLESS_TUBE_QUOTE_ANCHOR}`} className="text-sm font-medium hover:underline" style={{ color: "#E3000F" }}>
                          Quote only
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "#6b7280" }}>
              Send the sizes you need in the form below and we will quote them.
            </p>
          )}

          {product?.handle && (
            <p className="text-sm mt-4" style={{ color: "#6b7280" }}>
              Product details:{" "}
              <Link href={`/${countryCode}/products/${product.handle}`} className="underline hover:text-gray-900">
                {product.title}
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* ── Quote form ───────────────────────────────────────────────── */}
      <section
        id={STAINLESS_TUBE_QUOTE_ANCHOR}
        className="py-16 px-6 lg:px-12 border-t scroll-mt-28"
        style={{ borderColor: "#f0f0f0" }}
      >
        <div className="mx-auto max-w-[1440px] grid lg:grid-cols-2 gap-12 lg:gap-24 items-start">
          <div>
            <h2 className="font-sans text-3xl font-normal tracking-tight mb-4" style={{ color: "#111111" }}>
              Request a stainless tubing quote
            </h2>
            <p className="text-sm font-light leading-relaxed mb-6 max-w-md" style={{ color: "#6b7280" }}>
              Tick the sizes and alloys you need, add quantities and where it ships, and attach a PO or drawing if you have one. Pricing comes back within 48 hours and holds for 90 days.
            </p>
            <p className="text-sm font-light" style={{ color: "#6b7280" }}>
              Prefer email or phone?{" "}
              <a href="mailto:aleman@cardinalcoolingsystems.com" className="underline" style={{ color: "#E3000F" }}>
                aleman@cardinalcoolingsystems.com
              </a>{" "}
              · <a href="tel:+16309479955" className="underline" style={{ color: "#E3000F" }}>(630) 947-9955</a>
            </p>
          </div>
          <TubeQuoteForm options={options} />
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section className="py-16 px-6 lg:px-12 border-t" style={{ borderColor: "#f0f0f0" }}>
        <div className="mx-auto max-w-[1440px]">
          <h2 className="font-sans text-3xl font-normal tracking-tight mb-10" style={{ color: "#111111" }}>
            Stainless steel tubing FAQ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((f) => (
              <div key={f.q} className="p-6" style={{ backgroundColor: "#fafafa", border: "1px solid #f0f0f0", borderRadius: "5px" }}>
                <h3 className="text-sm font-semibold mb-2" style={{ color: "#111111" }}>{f.q}</h3>
                <p className="text-sm font-light leading-relaxed" style={{ color: "#6b7280" }}>
                  {f.a}
                  {f.q === "Can I get MTRs?" && (
                    <>
                      {" "}
                      <a href={MTR_LOOKUP_URL} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "#E3000F" }}>
                        Open the MTR lookup
                      </a>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
