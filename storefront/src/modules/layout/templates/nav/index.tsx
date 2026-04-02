"use client"

import { useState, useEffect } from "react"
import Logo from "./components/logo"
import NavigationMenu from "./components/navigation-menu"
import UserActions from "./components/user-actions"
import MobileMenu from "./components/mobile-menu"

interface NavProps {
  className?: string
}

export default function Nav({ className = "" }: NavProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out ${className}`}
      style={{
        backgroundColor: isScrolled ? "#E3000F" : "transparent",
        backdropFilter: isScrolled ? "blur(12px)" : "none",
        borderBottom: isScrolled ? "1px solid #E3000F" : "1px solid transparent",
      }}
    >
      <div className="mx-auto max-w-[1440px] px-6 lg:px-12">
        <div className="flex items-center justify-between h-20 lg:h-24">

          {/* Left — Navigation links */}
          <NavigationMenu className="hidden lg:flex flex-1" />

          {/* Center — Logo */}
          <div className="flex justify-center flex-1 lg:flex-none">
            <Logo />
          </div>

          {/* Right — User actions + mobile menu */}
          <div className="flex items-center justify-end flex-1">
            <UserActions />
            <MobileMenu className="lg:hidden ml-4" />
          </div>

        </div>
      </div>
    </header>
  )
}
