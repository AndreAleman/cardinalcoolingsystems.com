import Image from "next/image"
import Link from "next/link"

export default function Hero() {
  return (
    <section className="relative w-full overflow-hidden lg:h-[88vh] lg:min-h-[600px]">
      <Image
        src="/images/hero/image-bg.jpg"
        alt=""
        aria-hidden="true"
        fill
        priority
        fetchPriority="high"
        sizes="100vw"
        quality={60}
        className="object-cover object-center"
      />

      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.35)",
          backgroundImage: `
            linear-gradient(to right, rgba(180, 30, 30, 0.10) .75px, transparent 1px),
            linear-gradient(to bottom, rgba(180, 30, 30, 0.10) .75px, transparent 1px)
          `,
          backgroundSize: "10px 10px",
          zIndex: 1,
        }}
      />

      <div
        className="hidden lg:block absolute top-[172px] right-20 w-[860px] h-[860px] pointer-events-none select-none"
        style={{
          zIndex: 2,
          maskImage: "linear-gradient(to bottom, black 60%, transparent 70%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 70%)",
        }}
      >
        <Image
          src="/images/hero/tcross.jpg"
          alt="Stainless steel cooling component"
          width={860}
          height={860}
          sizes="860px"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="relative z-10 flex flex-col h-full px-6 lg:px-28">
        <div className="flex flex-col items-start gap-5 pt-24 pb-3 lg:my-auto max-w-[609px]">
          <h1 className="font-sans text-[36px] lg:text-[56px] font-normal leading-[42px] lg:leading-[60px] tracking-[-0.02em] text-grey-0">
            Engineered Stainless Components for Modern Cooling Infrastructure
          </h1>

          <p className="font-sans text-base lg:text-xl font-light leading-[24px] lg:leading-[26px] tracking-[-0.016em] text-grey-0/90">
            316L stainless steel fittings designed for high-performance cooling
            systems. Built for reliability in data centers, industrial
            infrastructure, and hygienic processing environments.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <Link
              href="/us/store"
              className="flex items-center gap-2 px-6 py-3 text-base font-medium tracking-wide text-white transition-all duration-200"
              style={{ border: "1px solid rgba(255,255,255,0.7)" }}
            >
              Shop
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Link
              href="/us/contact"
              className="flex items-center gap-2 px-6 py-3 text-base font-medium tracking-wide text-white transition-all duration-200"
              style={{ backgroundColor: "#E3000F", border: "1px solid #E3000F" }}
            >
              Request A Quote
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M7 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
