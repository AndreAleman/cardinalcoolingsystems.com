import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us - Sanitary Fitting Experts | Cardinal Cooling Systems",
  description:
    "Get expert guidance on stainless steel sanitary fittings for your project. Technical support for data centers, HVAC, and industrial applications. Call (630) 947-9955.",
  alternates: {
    canonical: 'https://cardinalcoolingsystems.com/us/contact'
  }
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
