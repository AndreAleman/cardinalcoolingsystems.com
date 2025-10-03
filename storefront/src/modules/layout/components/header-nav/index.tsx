"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

// Static navigation items (non-category items)
const staticNavigationItems = [
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
  { label: "About Us", href: "/about" }
]

interface NavigationProps {
  className?: string
}

export default function NavigationMenu({ className = "" }: NavigationProps) {
  const [categories, setCategories] = useState<HttpTypes.StoreProductCategory[]>([])
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [activeSubDropdown, setActiveSubDropdown] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState("Component mounted")
  
  // Timeout refs for delays
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const subDropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Debug: Component mounted
  useEffect(() => {
    console.log('🎯 NavigationMenu component mounted!')
    setDebugInfo("Component mounted, attempting to fetch categories...")
    
    const timer = setTimeout(() => {
      console.log('🚀 Starting to fetch categories with SDK...')
      setDebugInfo("Calling SDK...")
      
      sdk.store.category.list({
        fields: "id,name,handle,description,category_children.id,category_children.name,category_children.handle",
        include_descendants_tree: true,
        parent_category_id: null,
      }).then(({ product_categories }) => {
        console.log('📦 Categories fetched:', product_categories?.length || 0, 'items')
        console.log('📋 Categories data:', product_categories)
        setCategories(product_categories || [])
        setLoading(false)
        setDebugInfo(`Success! Found ${product_categories?.length || 0} categories`)
      }).catch(error => {
        console.error("❌ Error loading categories:", error)
        setLoading(false)
        setDebugInfo(`Error: ${error.message}`)
      })
    }, 1000) // Wait 1 second to ensure SDK is ready

    return () => clearTimeout(timer)
  }, [])

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
      if (subDropdownTimeoutRef.current) clearTimeout(subDropdownTimeoutRef.current)
    }
  }, [])

  const handleMainMenuEnter = (itemLabel: string) => {
    // Clear any pending timeouts
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    if (subDropdownTimeoutRef.current) {
      clearTimeout(subDropdownTimeoutRef.current)
      subDropdownTimeoutRef.current = null
    }
    setActiveDropdown(itemLabel)
  }

  const handleMainMenuLeave = () => {
    // Set timeout to close all dropdowns after 500ms
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
      setActiveSubDropdown(null)
    }, 500)
  }

  const handleSubMenuEnter = (subItemLabel: string) => {
    // Clear any pending close timeout
    if (subDropdownTimeoutRef.current) {
      clearTimeout(subDropdownTimeoutRef.current)
      subDropdownTimeoutRef.current = null
    }
    setActiveSubDropdown(subItemLabel)
  }

  const handleSubMenuLeave = () => {
    // Set timeout to close sub-dropdown after 400ms
    subDropdownTimeoutRef.current = setTimeout(() => {
      setActiveSubDropdown(null)
    }, 400)
  }

  const handleDropdownContainerEnter = () => {
    // Clear timeouts when entering dropdown area
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    if (subDropdownTimeoutRef.current) {
      clearTimeout(subDropdownTimeoutRef.current)
      subDropdownTimeoutRef.current = null
    }
  }

  return (
    <nav className={`flex items-center space-x-8 ${className}`}>
      {/* Temporary debug indicator */}
      <div className="text-xs text-red-500 bg-yellow-100 px-2 py-1 rounded">
        Debug: {debugInfo} | Categories: {categories.length} | Loading: {loading.toString()}
      </div>
      
      {/* Shop dropdown with dynamic categories */}
      <div 
        className="relative group"
        onMouseEnter={() => !loading && categories.length > 0 && handleMainMenuEnter("Shop")}
        onMouseLeave={() => !loading && categories.length > 0 && handleMainMenuLeave()}
      >
        <Link
          href="/store"
          className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2"
        >
          <span>Shop</span>
          {!loading && categories.length > 0 && (
            <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          )}
        </Link>
        
        {/* Dynamic Categories Dropdown */}
        {!loading && categories.length > 0 && activeDropdown === "Shop" && (
          <div 
            className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50 transition-all duration-200 ease-in-out"
            onMouseEnter={handleDropdownContainerEnter}
            onMouseLeave={handleMainMenuLeave}
          >
            {categories.map((category) => (
              <div key={category.id}>
                <Link
                  href={`/categories/${category.handle}`}
                  className="flex items-center justify-between px-4 py-2 text-base text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                >
                  <span>{category.name}</span>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Static navigation items */}
      {staticNavigationItems.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2"
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
