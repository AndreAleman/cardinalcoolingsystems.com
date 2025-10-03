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
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  return (
    <header 
      className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-300 ease-out
        ${isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
          : 'bg-white'
        }
        ${className}
      `}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 lg:h-24 py-2"> {/* Much thinner header */}
          {/* Left Navigation - Hidden on mobile */}
          <NavigationMenu className="hidden lg:flex flex-1" />
          
          {/* Centered Logo */}
          <div className="flex justify-center flex-1 lg:flex-none">
            <Logo />
          </div>
          
          {/* Right Actions */}
          <div className="flex items-center justify-end flex-1">
            <UserActions />
            <MobileMenu className="lg:hidden ml-4" />
          </div>
        </div>
      </div>
    </header>
  )
}