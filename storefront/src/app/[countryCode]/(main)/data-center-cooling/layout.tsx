import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Data Center Cooling Solutions | Cardinal Cooling Systems",
  description:
    "Stainless steel tubing and sanitary fittings engineered for data center liquid cooling, AI infrastructure, and high-performance thermal management.",
  alternates: {
    canonical: "https://cardinalcoolingsystems.com/us/data-center-cooling",
  },
}

export default function DataCenterCoolingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
