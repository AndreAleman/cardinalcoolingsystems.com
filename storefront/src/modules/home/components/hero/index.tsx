// src/modules/home/components/hero-stagger.tsx
import Image from "next/image"

export default function Hero() {
  return (
    <section className="bg-white pt-36 pb-8 lg:pt-40 md:pb-12"> {/* Updated to match header height */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* 60 / 40 on lg, fixed px on xl */}
        <div className="grid items-center gap-12 
                        lg:grid-cols-[60%_40%] 
                        xl:grid-cols-[593px_478px] xl:gap-[94px]">
          {/* ───────────── text column */}
          <div className="space-y-6 xl:max-w-[593px]">
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-gray-900">
              High-Quality<br />Sanitary Parts for<br />Every Need
            </h1>

            <p className="text-lg text-gray-600 max-w-xl">
              From large-scale food production to small-batch brewing, our
              stainless-steel fittings deliver reliability, hygiene, and
              performance you can trust.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              {/* filled primary */}
              <a
                href="/products"
                className="inline-flex items-center justify-center rounded-md bg-blue-600
                           px-6 py-3 text-white font-semibold hover:bg-blue-700
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Browse&nbsp;Products
              </a>

              {/* outlined secondary */}
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-md border border-blue-600
                           bg-white px-6 py-3 text-blue-600 font-semibold hover:bg-gray-50
                           focus-visible:outline focus-visible:outline-2
                           focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                Contact&nbsp;Us
              </a>
            </div>
          </div>

          {/* ───────────── photo mosaic (4 images) */}
          <div className="grid grid-cols-2 gap-4 lg:order-last xl:w-[478px]">
            {/* left column – shifted up (2 images) */}
            <div className="-translate-y-8 md:-translate-y-4 sm:translate-y-0 transition-transform">
              {[1, 2].map((n) => (
                <Image
                  key={n}
                  src={`/images/hero/home_page${n}.jpg`}
                  alt={`Industrial manufacturing equipment ${n}`}
                  width={231}
                  height={251}
                  className="h-56 w-full object-cover rounded-md shadow mb-4
                             [mask-image:linear-gradient(180deg,transparent_0%,black_35%,black_65%,transparent_100%)]"
                  priority={n === 1}
                />
              ))}
            </div>

            {/* right column – shifted down (2 images) */}
            <div className="translate-y-16 md:translate-y-8 sm:translate-y-0 transition-transform">
              {[3, 4].map((n) => (
                <Image
                  key={n}
                  src={`/images/hero/home_page${n}.jpg`}
                  alt={`Precision sanitary fittings ${n}`}
                  width={231}
                  height={251}
                  className="h-56 w-full object-cover rounded-md shadow mb-4
                             [mask-image:linear-gradient(180deg,transparent_0%,black_35%,black_65%,transparent_100%)]"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
