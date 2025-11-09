"use client"

import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

// Static navigation items
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
  const [activePath, setActivePath] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await sdk.store.category.list({
          include_descendants_tree: true,
          fields: "id,name,handle,parent_category_id,category_children.id,category_children.name,category_children.handle,category_children.category_children.id,category_children.category_children.name,category_children.category_children.handle,category_children.category_children.category_children.id,category_children.category_children.category_children.name,category_children.category_children.category_children.handle"
        })
        
        const allCategories = response.product_categories || []
        const parentCategories = allCategories.filter(cat => 
          cat.parent_category_id === null || cat.parent_category_id === undefined
        )
        
        setCategories(parentCategories)
        setLoading(false)
      } catch (error) {
        console.error("❌ Error loading categories:", error)
        setLoading(false)
      }
    }

    fetchCategories()
    const intervalId = setInterval(fetchCategories, 300000)
    return () => clearInterval(intervalId)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null)
        setActivePath([])
      }
    }

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault()
    setActiveDropdown(activeDropdown === "Shop" ? null : "Shop")
    setActivePath([])
  }

  const handleCategoryClick = (categoryName: string, hasChildren: boolean) => {
    if (hasChildren) {
      setActivePath([categoryName])
    }
  }

  const handleSubcategoryClick = (parentName: string, categoryName: string, hasChildren: boolean) => {
    if (hasChildren) {
      setActivePath([parentName, categoryName])
    }
  }

  const handleThirdLevelClick = (grandparentName: string, parentName: string, categoryName: string, hasChildren: boolean) => {
    if (hasChildren) {
      setActivePath([grandparentName, parentName, categoryName])
    }
  }

  const renderCategoryLevel = (categories: HttpTypes.StoreProductCategory[], level: number, parentPath: string[] = []) => {
    const width = Math.max(180, 220 - (level * 15))
    const leftOffset = level === 0 ? 0 : -1
    
    return (
      <div 
        className={`absolute ${level === 0 ? 'top-full left-0 mt-1' : 'top-0 left-full'} bg-white rounded-lg shadow-lg border border-gray-100 py-2`}
        style={{ 
          width: `${width}px`,
          marginLeft: level > 0 ? `${leftOffset}px` : '0',
          zIndex: 50 + (level * 5)
        }}
      >
        {/* View All Link - Only for top level */}
        {level === 0 && (
          <div className="border-b border-gray-100 mb-1">
            <Link
              href="/store"
              className="flex items-center px-4 py-3 text-sm font-semibold text-blue-600 hover:bg-blue-50 transition-colors duration-150"
              onClick={() => {
                setActiveDropdown(null)
                setActivePath([])
              }}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              View All Products
            </Link>
          </div>
        )}

        {categories.map((category) => {
          const currentPath = [...parentPath, category.name]
          const isActive = activePath.length > level && activePath[level] === category.name
          const hasChildren = category.category_children && category.category_children.length > 0
          
          return (
            <div 
              key={category.id}
              className="relative"
            >
              {hasChildren ? (
                <div
                  onClick={() => {
                    if (level === 0) {
                      handleCategoryClick(category.name, hasChildren)
                    } else if (level === 1) {
                      handleSubcategoryClick(parentPath[0], category.name, hasChildren)
                    } else if (level === 2) {
                      handleThirdLevelClick(parentPath[0], parentPath[1], category.name, hasChildren)
                    } else {
                      setActivePath([...currentPath])
                    }
                  }}
                  className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 cursor-pointer"
                >
                  <span>{category.name}</span>
                  <svg className="w-3 h-3 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              ) : (
                <Link
                  href={`/categories/${category.handle}`}
                  className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                  onClick={() => {
                    setActiveDropdown(null)
                    setActivePath([])
                  }}
                >
                  <span>{category.name}</span>
                </Link>
              )}

              {hasChildren && isActive && category.category_children && (
                renderCategoryLevel(category.category_children, level + 1, currentPath)
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <nav className={`flex items-center space-x-8 ${className}`}>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2"
        >
          <span>Shop</span>
          <svg 
            className={`w-4 h-4 ml-1 transition-transform duration-200 ${activeDropdown === "Shop" ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24" 
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {!loading && categories.length > 0 && activeDropdown === "Shop" && (
          renderCategoryLevel(categories, 0)
        )}
      </div>

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
