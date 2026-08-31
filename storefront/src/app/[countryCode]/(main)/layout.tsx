import React from "react"
import { Metadata } from "next"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { getBaseURL } from "@lib/util/env"
import NavSpacer from "@modules/layout/components/nav-spacer"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "Stainless Steel Tubing, Fittings, and Valves | Cardinal Cooling Systems",
  description: "Your premium source for stainless steel tubing, fittings, and valves",
  openGraph: {
    title: "Stainless Steel Tubing, Fittings, and Valves | Cardinal Cooling Systems",
    description: "Your premium source for stainless steel tubing, fittings, and valves",
    url: getBaseURL(),
    siteName: "Cardinal Cooling Systems",
    images: [
      {
        url: "images/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Cardinal Cooling Systems - Stainless Steel Products",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stainless Steel Tubing, Fittings, and Valves | Cardinal Cooling Systems",
    description: "Your premium source for stainless steel tubing, fittings, and valves",
  },
}

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Cardinal Cooling Systems LLC",
  alternateName: "Cardinal Cooling Systems",
  legalName: "Cardinal Cooling Systems LLC",
  url: "https://cardinalcoolingsystems.com",
  logo: "https://cardinalcoolingsystems.com/images/og-image.jpeg",
  email: "aleman@cardinalcoolingsystems.com",
  telephone: "+1-630-947-9955",
  address: {
    "@type": "PostalAddress",
    streetAddress: "333 S.E. 2nd Avenue, Suite 2000",
    addressLocality: "Miami",
    addressRegion: "FL",
    postalCode: "33131",
    addressCountry: "US",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+1-630-947-9955",
      email: "aleman@cardinalcoolingsystems.com",
      contactType: "customer service",
      areaServed: "US",
      availableLanguage: ["English"],
    },
  ],
}

export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Nav />
      <main className="relative flex flex-col flex-1">
        <NavSpacer />
        {props.children}
      </main>
      <Footer />
    </div>
  )
}
