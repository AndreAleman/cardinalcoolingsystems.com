"use client"

export default function Hero() {
  return (
    <section className="relative w-full h-screen min-h-[62rem] overflow-hidden">
      {/* ── Background image ── */}
      <img
        src="/images/hero/image-bg.jpg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* ── Product image — right side ── */}
{/* ── Product image — right side ── */}
<img
  src="/images/hero/image-9.png"
  alt="Stainless steel cooling component"
  className="absolute top-[172px] right-20 w-[860px] h-[860px] object-contain pointer-events-none select-none"
style={{
  maskImage: "linear-gradient(to bottom, black 60%, transparent 70%)",
  WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 70%)",
}}
/>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col h-full px-28">
        {/* Left text block — vertically centered */}
        <div className="flex flex-col items-start gap-6 my-auto max-w-[609px]">
          <h1 className="
            font-sans
            text-[56px]
            font-normal
            leading-[60px]
            tracking-[-0.02em]
            text-grey-0
          ">
            Engineered Stainless Components for Modern Cooling Infrastructure
          </h1>

          <p className="
            font-sans
            text-xl
            font-light
            leading-[26px]
            tracking-[-0.016em]
            text-grey-0/90
          ">
            316L stainless steel fittings designed for high-performance cooling systems. Built for reliability in data centers, industrial infrastructure, and hygienic processing environments.
          </p>
        </div>

        {/* Trusted logos — pinned to bottom */}
        <div className="flex items-center gap-18 pb-10">
          <p className="
            font-sans
            text-xl
            font-normal
            leading-[26px]
            tracking-[-0.02em]
            text-grey-0
            whitespace-nowrap
            shrink-0
          ">
            Trusted by engineers in
          </p>

          <div className="flex items-center gap-8" aria-label="Trusted companies">
            <img
              src="/images/logos/empirical.png"
              alt="Empirical"
              className="h-8 w-auto object-contain"
            />
            <img
              src="/images/logos/north-american.png"
              alt="North American Builders Supply"
              className="h-8 w-auto object-contain"
            />
            <img
              src="/images/logos/lawless.png"
              alt="Lawless Group"
              className="h-8 w-auto object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  )
}