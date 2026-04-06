"use client"
import { usePathname } from "next/navigation"

export default function NavSpacer() {
  const pathname = usePathname()
  const isHomePage = pathname === "/us" || pathname === "/"
  if (isHomePage) return null
  return <div className="h-20 lg:h-24" />
}