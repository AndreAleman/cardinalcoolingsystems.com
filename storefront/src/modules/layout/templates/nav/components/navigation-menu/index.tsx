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
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch ALL categories with parent_category_id and children
        const response = await sdk.store.category.list({
          include_descendants_tree: true,
          fields: "id,name,handle,parent_category_id,category_children.id,category_children.name,category_children.handle,category_children.category_children.id,category_children.category_children.name,category_children.category_children.handle,category_children.category_children.category_children.id,category_children.category_children.category_children.name,category_children.category_children.category_children.handle"
        })
        
        const allCategories = response.product_categories || []
        
        // Filter client-side for categories where parent_category_id is null
        const parentCategories = allCategories.filter(cat => 
          cat.parent_category_id === null || cat.parent_category_id === undefined
        )
        
        console.log('📦 Total categories fetched:', allCategories.length)
        console.log('✅ Parent categories (parent_category_id = null):', parentCategories.length)
        console.log('📋 Parent category names:', parentCategories.map(c => c.name))
        
        setCategories(parentCategories)
        setLoading(false)
      } catch (error) {
        console.error("❌ Error loading categories:", error)
        setLoading(false)
      }
    }

    fetchCategories()

    // Refetch every 5 minutes
    const intervalId = setInterval(fetchCategories, 300000)
    return () => clearInterval(intervalId)
  }, [])

  const clearTimeouts = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const handleNavEnter = () => {
    if (!loading && categories.length > 0) {
      clearTimeouts()
      setActiveDropdown("Shop")
    }
  }

  const handleNavLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
      setActivePath([])
    }, 500)
  }

  const handleDropdownEnter = () => {
    clearTimeouts()
  }

  const handleDropdownLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
      setActivePath([])
    }, 300)
  }

  const handleCategoryHover = (categoryName: string, hasChildren: boolean) => {
    clearTimeouts()
    if (hasChildren) {
      setActivePath([categoryName])
    } else {
      setActivePath([])
    }
  }

  const handleSubcategoryHover = (parentName: string, categoryName: string, hasChildren: boolean) => {
    clearTimeouts()
    if (hasChildren) {
      setActivePath([parentName, categoryName])
    } else {
      setActivePath([parentName])
    }
  }

  const handleThirdLevelHover = (grandparentName: string, parentName: string, categoryName: string, hasChildren: boolean) => {
    clearTimeouts()
    if (hasChildren) {
      setActivePath([grandparentName, parentName, categoryName])
    } else {
      setActivePath([grandparentName, parentName])
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
        onMouseEnter={handleDropdownEnter}
        onMouseLeave={handleDropdownLeave}
      >
        {categories.map((category) => {
          const currentPath = [...parentPath, category.name]
          const isActive = activePath.length > level && activePath[level] === category.name
          const hasChildren = category.category_children && category.category_children.length > 0
          
          return (
            <div 
              key={category.id}
              className="relative"
              onMouseEnter={() => {
                clearTimeouts()
                if (level === 0) {
                  handleCategoryHover(category.name, hasChildren)
                } else if (level === 1) {
                  handleSubcategoryHover(parentPath[0], category.name, hasChildren)
                } else if (level === 2) {
                  handleThirdLevelHover(parentPath[0], parentPath[1], category.name, hasChildren)
                } else {
                  if (hasChildren) {
                    setActivePath([...currentPath])
                  } else {
                    setActivePath([...parentPath])
                  }
                }
              }}
            >
              <Link
                href={`/categories/${category.handle}`}
                className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
              >
                <span>{category.name}</span>
                {hasChildren && (
                  <svg className="w-3 h-3 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </Link>

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
      <div 
        className="relative"
        onMouseEnter={handleNavEnter}
        onMouseLeave={handleNavLeave}
      >
        <Link
          href="/store"
          className="flex items-center space-x-1 text-base font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200 py-2"
        >
          <span>Shop</span>
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </Link>

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
