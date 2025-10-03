import { Metadata } from "next"

import Footer from "@modules/layout/templates/footer"
import Nav from "@modules/layout/templates/nav"
import HeaderSearchSection from "@modules/layout/components/header-search-section"
import { getBaseURL } from "@lib/util/env"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: "Stainless Steel Tubing, Fittings, and Valves | Cowbird Depot",
  description: "Your premium source for stainless steel tubing, fittings, and valves",
  openGraph: {
    title: "Stainless Steel Tubing, Fittings, and Valves | Cowbird Depot", 
    description: "Your premium source for stainless steel tubing, fittings, and valves",
    url: getBaseURL(),
    siteName: "Cowbird Depot",
    images: [
      {
        url: "images/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Cowbird Depot - Stainless Steel Products",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stainless Steel Tubing, Fittings, and Valves | Cowbird Depot",
    description: "Your premium source for stainless steel tubing, fittings, and valves",
  },
}
export default function PageLayout(props: { children: React.ReactNode }) {
  return (
    <>
      {/* Main Navigation - Fixed at top */}
      <Nav />
      
      {/* Search Section - Fixed below nav */}
      <HeaderSearchSection />
      
      {/* Main Content - Add padding-top to account for fixed header + search */}
      <main className="relative pt-32 lg:pt-36">
        {props.children}
      </main>
      
      {/* Footer */}
      <Footer />
    </>
  )
}


