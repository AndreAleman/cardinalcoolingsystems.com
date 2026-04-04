import React from "react"
import { Metadata } from "next"
import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import { getBaseURL } from "@lib/util/env"

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

export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      {/* Main Navigation - Fixed at top, transparent until scroll */}
      <Nav />

      {/* Main Content - No top padding so hero sits under transparent nav */}
      <main className="relative">
        {props.children}
      </main>

      {/* Footer */}
      <Footer />
    </>
  )
}
