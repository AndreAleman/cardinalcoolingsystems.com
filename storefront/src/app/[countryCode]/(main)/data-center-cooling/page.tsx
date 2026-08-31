"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"

const PHONE = "(630) 947-9955"
const EMAIL = "sales@cardinalcoolingsystems.com"

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// Falls back through: categoryImage → productImage → logo on red
function CardImage({ sources, alt }: { sources: string[]; alt: string }) {
  const [idx, setIdx] = useState(0)
  const current = sources[idx]

  if (!current) {
    return (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#E3000F", display: "flex", alignItems: "center", justifyContent: "center", padding: 32 }}>
        <img src="/images/logo/new-cardinal-cooling-logo.svg" alt="Cardinal Cooling Systems" style={{ maxHeight: 64, maxWidth: "70%", objectFit: "contain", filter: "brightness(0) invert(1)" }} />
      </div>
    )
  }

  return (
    <img
      src={current}
      alt={alt}
      onError={() => setIdx(i => i + 1)}
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
    />
  )
}

const products = [
  {
    title: "Stainless Steel Tubing",
    copy: "Engineered for thermal cycling and high flow rates in chilled water and dielectric cooling loops. 304 & 316L, 3-A certified.",
    href: "/us/categories/tubes",
    // Add your own images here: category photo first, then a product thumbnail from Medusa CDN
    images: [
      "/images/categories/tubing.jpg",
      "/images/data-center/products/tubing.jpg",
    ],
  },
  {
    title: "Ball & Butterfly Valves",
    copy: "Precision flow control optimized for liquid cooling circuits under fluctuating load conditions. Clamp, weld, and threaded ends.",
    href: "/us/categories/valves",
    images: [
      "/images/categories/valves.jpg",
      "/images/data-center/products/valves.jpg",
    ],
  },
  {
    title: "Sanitary Fittings",
    copy: "Tri-clamp, butt-weld, bevel seat, and I-line fittings delivering zero-leak integrity at every junction in your cooling loop.",
    href: "/us/categories/fittings",
    images: [
      "/images/categories/fittings.jpg",
      "/images/data-center/products/fittings.jpg",
    ],
  },
  {
    title: "Adapters & Connectors",
    copy: "NPT, BSPP, and tri-clamp transitions for seamless integration with CDU inlets, manifold ports, and existing infrastructure.",
    href: "/us/categories/clamp-fittings",
    images: [
      "/images/categories/adapters.jpg",
      "/images/data-center/products/adapters.jpg",
    ],
  },
  {
    title: "Spray Balls & CIP",
    copy: "Automated weld ferrules and CIP devices for orbital-welded, contamination-free cooling loops in high-density AI clusters.",
    href: "/us/categories/spray-balls",
    images: [
      "/images/categories/spray-balls.jpg",
      "/images/data-center/products/spray-balls.jpg",
    ],
  },
  {
    title: "Tube Hangers & Supports",
    copy: "Stainless hex hangers with vibration-isolating grommets to stabilize high-pressure loops across rack rows.",
    href: "/us/categories/hangers",
    images: [
      "/images/categories/hangers.jpg",
      "/images/data-center/products/hangers.jpg",
    ],
  },
]

const reasons = [
  { label: "Corrosion Resistance", detail: "Immune to glycol, dielectric fluid, and aggressive cleaning agents that degrade copper or carbon steel over time." },
  { label: "Thermal Stability", detail: "Maintains dimensional accuracy and flow performance through constant temperature cycling from idle to peak load." },
  { label: "Zero-Leak Precision", detail: "Orbital-weld compatible ferrules and precision clamp faces eliminate joint failures that cause catastrophic downtime." },
  { label: "Pressure Rated", detail: "Handles the continuous mechanical stress of high-flow pumped loops and pressure transients in large facilities." },
  { label: "Long Service Life", detail: "Outlasts plastics and mixed metals by decades, reducing lifecycle replacement cost and facility disruption." },
  { label: "3-A Certified Clean", detail: "Ultra-smooth 32Ra interior finish prevents biofilm and particulate buildup that degrades cooling efficiency." },
]

const applications = [
  { title: "AI & GPU Compute Clusters", copy: "Direct liquid cooling for Nvidia DGX, AMD MI300 arrays, and custom ASIC training infrastructure generating extreme heat densities above 100 kW/rack.", tag: "HIGH PRIORITY" },
  { title: "Mission-Critical Banking & Healthcare", copy: "Uptime-focused loops for regulated environments where a single leak event triggers mandatory shutdown and millions in lost transactions.", tag: "ZERO TOLERANCE" },
  { title: "Hyperscale & Colocation", copy: "Scalable manifold and fluid network architecture that expands with megawatt-class build-outs without re-engineering the entire loop.", tag: "SCALABLE" },
]

const faqs = [
  { q: "Can sanitary process equipment be used in data center cooling loops?", a: "Yes — sanitary stainless steel fittings and tubing are ideal for data center liquid cooling. The same leak-resistant seals, corrosion immunity, and precision fabrication that protect pharmaceutical processes perform equally well in mission-critical cooling infrastructure. Many hyperscale operators now specify 316L sanitary components for their CDU secondary loops." },
  { q: "What stainless grade is best for liquid cooling — 304 or 316L?", a: "316L is recommended for any loop using glycol-based coolants, deionized water, or dielectric fluids because its molybdenum content provides significantly better resistance to pitting and crevice corrosion. 304 is acceptable for clean water loops where chloride exposure is minimal and cost is a consideration." },
  { q: "Do you supply custom lengths and cut-to-size tubing for data center builds?", a: "Yes. We supply standard 20-foot lengths and cut-to-length tubing for large data center projects. For high-volume builds we can also source pre-fabricated spool assemblies with pre-attached fittings to reduce on-site welding and accelerate installation timelines." },
  { q: "What is the lead time for large orders?", a: "Standard stock items typically ship within 1–2 business days. Large project orders with custom specifications are quoted with lead times based on scope. Contact our sales team directly to discuss project timelines and volume pricing." },
]

export default function DataCenterLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const hero = useInView(0.1)
  const products_s = useInView(0.1)
  const why_s = useInView(0.1)
  const apps_s = useInView(0.1)
  const faq_s = useInView(0.1)
  const cta_s = useInView(0.1)

  return (
    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", overflowX: "hidden" }}>

      {/* ── HERO (dark) ── */}
      <section
        ref={hero.ref}
        style={{
          minHeight: "100vh", display: "flex", alignItems: "center",
          position: "relative", padding: "120px 48px 80px",
          background: "linear-gradient(rgba(10,10,10,0.8), rgba(10,10,10,0.9)), url('/images/data-center/hero.jpg') center/cover no-repeat",
          backgroundColor: "#0a0a0a", color: "#fff",
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: 0.05, backgroundImage: "linear-gradient(#E3000F 1px, transparent 1px), linear-gradient(90deg, #E3000F 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div style={{ position: "absolute", top: "20%", right: "10%", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(227,0,15,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%", position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 24,
            padding: "6px 16px", border: "1px solid rgba(227,0,15,0.4)", borderRadius: 3,
            opacity: hero.inView ? 1 : 0, transform: hero.inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.6s ease",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#E3000F", display: "block" }} />
            <span style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E3000F", fontWeight: 500 }}>Liquid Cooling Infrastructure</span>
          </div>

          <h1 style={{
            fontSize: "clamp(36px, 6vw, 80px)", fontWeight: 300, lineHeight: 1.05,
            letterSpacing: "-0.02em", marginBottom: 24, maxWidth: 900,
            opacity: hero.inView ? 1 : 0, transform: hero.inView ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.7s ease 0.1s",
          }}>
            Engineered Stainless Steel<br />
            <span style={{ color: "#E3000F" }}>for Data Center</span><br />
            Cooling Systems
          </h1>

          <p style={{
            fontSize: 18, fontWeight: 300, lineHeight: 1.7, color: "rgba(255,255,255,0.6)",
            maxWidth: 560, marginBottom: 48,
            opacity: hero.inView ? 1 : 0, transform: hero.inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s ease 0.2s",
          }}>
            High-performance, corrosion-resistant piping, fittings, and valve stations for mission-critical
            liquid-cooled AI clusters, HPC facilities, and hyperscale data centers.
            Built for zero-leak reliability and maximum uptime.
          </p>

          <div style={{
            display: "flex", gap: 16, flexWrap: "wrap",
            opacity: hero.inView ? 1 : 0, transform: hero.inView ? "translateY(0)" : "translateY(20px)",
            transition: "all 0.7s ease 0.3s",
          }}>
            <a href={`tel:${PHONE.replace(/\D/g,"")}`} style={{
              display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: "#E3000F",
              color: "#fff", padding: "16px 32px", borderRadius: 4, fontWeight: 600, fontSize: 15, textDecoration: "none",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
              Call {PHONE}
            </a>
            <a href={`mailto:${EMAIL}`} style={{
              display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: "transparent",
              color: "#fff", padding: "16px 32px", borderRadius: 4, fontWeight: 500, fontSize: 15,
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.25)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Get a Quote
            </a>
            <Link href="/us/store" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              color: "rgba(255,255,255,0.5)", padding: "16px 24px",
              fontSize: 14, textDecoration: "none", letterSpacing: "0.05em", textTransform: "uppercase",
            }}>
              Browse Products →
            </Link>
          </div>

          <div style={{
            marginTop: 80, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex", gap: 48, flexWrap: "wrap",
            opacity: hero.inView ? 1 : 0, transition: "all 0.7s ease 0.5s",
          }}>
            {["3-A Certified 304 & 316L", "Ships 1–2 Business Days", "Free Shipping Over $100", "Mission-Critical Grade"].map(t => (
              <div key={t} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: "#E3000F" }}>✓</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", letterSpacing: "0.03em" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS (white) ── */}
      <section ref={products_s.ref} style={{ padding: "100px 48px", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            marginBottom: 60,
            opacity: products_s.inView ? 1 : 0, transform: products_s.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s ease",
          }}>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E3000F", marginBottom: 16, fontWeight: 500 }}>Product Solutions</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300, letterSpacing: "-0.02em", color: "#111", maxWidth: 600 }}>
              Everything Your Cooling Loop Needs
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
            {products.map((p, i) => (
              <Link key={p.title} href={p.href} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    border: "1px solid #e5e7eb", borderRadius: 5, overflow: "hidden",
                    backgroundColor: "#fff", transition: "box-shadow 0.2s ease",
                    opacity: products_s.inView ? 1 : 0,
                    transform: products_s.inView ? "translateY(0)" : "translateY(32px)",
                    transitionDelay: `${i * 0.08}s`,
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = "none"}
                >
                  {/* Image — tries each source in order, falls back to logo */}
                  <div style={{ height: 200, overflow: "hidden", backgroundColor: "#f3f4f6", position: "relative" }}>
                    <CardImage sources={p.images} alt={p.title} />
                  </div>
                  <div style={{ padding: "28px 28px 24px" }}>
                    <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 10, color: "#111", letterSpacing: "-0.01em" }}>{p.title}</h3>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: "#6b7280", marginBottom: 20 }}>{p.copy}</p>
                    <span style={{ fontSize: 12, color: "#E3000F", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
                      Shop Now →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY STAINLESS (light gray) ── */}
      <section ref={why_s.ref} style={{ padding: "100px 48px", backgroundColor: "#f8f8f8" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start",
            opacity: why_s.inView ? 1 : 0, transform: why_s.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s ease",
          }}>
            <div>
              <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E3000F", marginBottom: 16, fontWeight: 500 }}>Material Science</p>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 300, lineHeight: 1.15, letterSpacing: "-0.02em", marginBottom: 24, color: "#111" }}>
                Why Stainless Steel in High-Density Liquid Cooling
              </h2>
              <p style={{ fontSize: 16, lineHeight: 1.8, color: "#6b7280", marginBottom: 40 }}>
                As rack densities exceed 100 kW and coolants diversify from water to glycols and dielectrics,
                the piping material becomes a critical engineering decision — not an afterthought.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {[
                  ["Call our technical team", `tel:${PHONE.replace(/\D/g,"")}`],
                  ["Email for project specs", `mailto:${EMAIL}`],
                ].map(([label, href]) => (
                  <a key={label} href={href} style={{
                    display: "inline-flex", alignItems: "center", gap: 10,
                    color: "#111", fontSize: 14, textDecoration: "none", fontWeight: 500,
                    padding: "16px 0", borderBottom: "1px solid #e5e7eb",
                  }}>
                    <span style={{ color: "#E3000F" }}>→</span> {label}
                  </a>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {reasons.map((r, i) => (
                <div key={r.label} style={{
                  padding: "28px 24px", border: "1px solid #e5e7eb", borderRadius: 5, backgroundColor: "#fff",
                  opacity: why_s.inView ? 1 : 0,
                  transform: why_s.inView ? "translateY(0)" : "translateY(20px)",
                  transition: `all 0.6s ease ${i * 0.07}s`,
                }}>
                  <div style={{ width: 32, height: 2, backgroundColor: "#E3000F", marginBottom: 16 }} />
                  <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#111", letterSpacing: "0.02em" }}>{r.label}</h4>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: "#9ca3af" }}>{r.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── APPLICATIONS (white) ── */}
      <section ref={apps_s.ref} style={{ padding: "100px 48px", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            marginBottom: 60,
            opacity: apps_s.inView ? 1 : 0, transform: apps_s.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s ease",
          }}>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E3000F", marginBottom: 16, fontWeight: 500 }}>Applications</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300, letterSpacing: "-0.02em", color: "#111" }}>Who We Serve</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 24 }}>
            {applications.map((app, i) => (
              <div key={app.title} style={{
                padding: "48px 40px", border: "1px solid #e5e7eb", borderRadius: 5,
                position: "relative", overflow: "hidden", backgroundColor: "#fff",
                opacity: apps_s.inView ? 1 : 0,
                transform: apps_s.inView ? "translateY(0)" : "translateY(32px)",
                transition: `all 0.6s ease ${i * 0.1}s`,
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, backgroundColor: "#E3000F" }} />
                <span style={{
                  display: "inline-block", fontSize: 10, letterSpacing: "0.12em", fontWeight: 600,
                  color: "#E3000F", border: "1px solid rgba(227,0,15,0.25)", padding: "4px 10px",
                  borderRadius: 2, marginBottom: 24, textTransform: "uppercase",
                }}>
                  {app.tag}
                </span>
                <h3 style={{ fontSize: 20, fontWeight: 500, marginBottom: 16, letterSpacing: "-0.01em", color: "#111" }}>{app.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.8, color: "#6b7280" }}>{app.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER (dark) ── */}
      <section ref={cta_s.ref} style={{
        padding: "100px 48px",
        background: "linear-gradient(135deg, #0a0a0a 0%, #1a0000 50%, #0a0a0a 100%)",
        position: "relative", overflow: "hidden", color: "#fff",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "linear-gradient(#E3000F 1px, transparent 1px), linear-gradient(90deg, #E3000F 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div style={{
          maxWidth: 800, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1,
          opacity: cta_s.inView ? 1 : 0, transform: cta_s.inView ? "translateY(0)" : "translateY(24px)",
          transition: "all 0.6s ease",
        }}>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 56px)", fontWeight: 300, letterSpacing: "-0.02em", marginBottom: 20 }}>
            Ready to Spec Your<br /><span style={{ color: "#E3000F" }}>Cooling Loop?</span>
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 48px" }}>
            Talk to our team about volume pricing, custom lengths, or project-specific specifications.
            Most stock ships in 1–2 business days.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href={`tel:${PHONE.replace(/\D/g,"")}`} style={{
              display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: "#E3000F",
              color: "#fff", padding: "18px 40px", borderRadius: 4, fontWeight: 600, fontSize: 16, textDecoration: "none",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/></svg>
              Call {PHONE}
            </a>
            <a href={`mailto:${EMAIL}?subject=Data Center Cooling Project Inquiry`} style={{
              display: "inline-flex", alignItems: "center", gap: 10, backgroundColor: "transparent",
              color: "#fff", padding: "18px 40px", borderRadius: 4, fontWeight: 500, fontSize: 16,
              textDecoration: "none", border: "1px solid rgba(255,255,255,0.2)",
            }}>
              Email for a Quote
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.25)" }}>{EMAIL} · {PHONE}</p>
        </div>
      </section>

      {/* ── FAQ (light gray) ── */}
      <section ref={faq_s.ref} style={{ padding: "100px 48px", backgroundColor: "#f8f8f8" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{
            marginBottom: 60,
            opacity: faq_s.inView ? 1 : 0, transform: faq_s.inView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s ease",
          }}>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#E3000F", marginBottom: 16, fontWeight: 500 }}>FAQ</p>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 300, letterSpacing: "-0.02em", color: "#111" }}>Common Questions</h2>
          </div>

          <div style={{ borderTop: "1px solid #e5e7eb" }}>
            {faqs.map((faq, i) => (
              <div key={i} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "28px 0", background: "none", border: "none", cursor: "pointer",
                    color: "#111", textAlign: "left", gap: 24,
                  }}
                >
                  <span style={{ fontSize: 16, fontWeight: 400, lineHeight: 1.4 }}>{faq.q}</span>
                  <span style={{
                    flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
                    border: "1px solid #d1d5db", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 18, color: "#E3000F",
                    transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                  }}>+</span>
                </button>
                {openFaq === i && (
                  <div style={{ paddingBottom: 28 }}>
                    <p style={{ fontSize: 15, lineHeight: 1.8, color: "#6b7280" }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BOTTOM STRIP (dark) ── */}
      <section style={{ padding: "60px 48px", backgroundColor: "#0a0a0a", color: "#fff" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
          <div>
            <p style={{ fontSize: 20, fontWeight: 300, marginBottom: 4 }}>Cardinal Cooling Systems</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>Premium stainless steel for mission-critical liquid cooling infrastructure</p>
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <a href={`tel:${PHONE.replace(/\D/g,"")}`} style={{ padding: "12px 28px", backgroundColor: "#E3000F", color: "#fff", borderRadius: 4, fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
              {PHONE}
            </a>
            <a href={`mailto:${EMAIL}?subject=Data Center Inquiry`} style={{ padding: "12px 28px", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: 4, fontWeight: 400, fontSize: 14, textDecoration: "none" }}>
              {EMAIL}
            </a>
          </div>
        </div>
      </section>

    </div>
  )
}
