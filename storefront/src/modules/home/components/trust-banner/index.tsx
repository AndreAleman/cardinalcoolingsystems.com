import Image from "next/image"

export default function TrustBanner() {
  return (
    <section
      className="w-full py-10 lg:py-12"
      style={{ backgroundColor: "#2a2a2a", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">

        {/* Desktop — full width spread */}
        <div className="hidden lg:flex items-center justify-between gap-8">
          <p className="font-sans text-sm font-normal tracking-widest uppercase text-white/40 whitespace-nowrap flex-shrink-0">
            Trusted by engineers in
          </p>
          <div className="w-px h-6 bg-white/15 flex-shrink-0" />
          <div className="flex items-center justify-around flex-1 gap-8">
            <a href="https://empiricalfoods.com/" target="_blank" rel="noopener noreferrer">
              <Image src="/images/logos/empirical.png" alt="Empirical" width={140} height={40} loading="lazy" className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200" />
            </a>
            <a href="https://nabsupply.com/" target="_blank" rel="noopener noreferrer">
              <Image src="/images/logos/north-american.png" alt="North American Builders Supply" width={140} height={40} loading="lazy" className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200" />
            </a>
            <a href="https://lawlessgroup.com/" target="_blank" rel="noopener noreferrer">
              <Image src="/images/logos/lawless.png" alt="Lawless Group" width={140} height={40} loading="lazy" className="h-10 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200" />
            </a>
          </div>
        </div>

        {/* Mobile — label above, logos scrollable */}
        <div className="lg:hidden">
          <p className="font-sans text-xs font-normal tracking-widest uppercase text-white/40 text-center mb-6">
            Trusted by engineers in
          </p>
          <div className="overflow-x-auto scrollbar-none -mx-6 px-6">
            <div className="flex items-center gap-10 w-max mx-auto">
              <a href="https://empiricalfoods.com/" target="_blank" rel="noopener noreferrer">
                <Image src="/images/logos/empirical.png" alt="Empirical" width={112} height={32} loading="lazy" className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200" />
              </a>
              <a href="https://nabsupply.com/" target="_blank" rel="noopener noreferrer">
                <Image src="/images/logos/north-american.png" alt="North American Builders Supply" width={112} height={32} loading="lazy" className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200" />
              </a>
              <a href="https://lawlessgroup.com/" target="_blank" rel="noopener noreferrer">
                <Image src="/images/logos/lawless.png" alt="Lawless Group" width={112} height={32} loading="lazy" className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity duration-200" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
