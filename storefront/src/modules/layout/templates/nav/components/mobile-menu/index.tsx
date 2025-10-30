"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

interface MobileMenuProps {
  className?: string
}

export default function MobileMenu({ className = "" }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<HttpTypes.StoreProductCategory[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  // Fetch categories on mount
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

  // Static navigation items (non-shop items)
  const staticNavigationItems = [
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
    { label: "About Us", href: "/about" },
    { label: "Account", href: "/account" },
    { label: "Cart", href: "/cart" }
  ]

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName)
    } else {
      newExpanded.add(categoryName)
    }
    setExpandedCategories(newExpanded)
  }

  const handleLinkClick = () => {
    setIsOpen(false)
  }

  const renderCategoryLevel = (categories: HttpTypes.StoreProductCategory[], level: number) => {
    const paddingLeft = 12 + (level * 4) // Base padding of 12 (3rem) + 4 per level (1rem)
    const bgColor = level === 0 ? 'bg-gray-50' : level === 1 ? 'bg-gray-100' : level === 2 ? 'bg-gray-200' : 'bg-gray-300'
    const hoverBg = level === 0 ? 'hover:bg-gray-100' : level === 1 ? 'hover:bg-gray-200' : level === 2 ? 'hover:bg-gray-300' : 'hover:bg-gray-400'
    const textSize = level === 0 ? 'text-base' : level === 1 ? 'text-sm' : 'text-xs'

    return (
      <div className={bgColor}>
        {categories.map((category) => {
          const hasChildren = category.category_children && category.category_children.length > 0
          const isExpanded = expandedCategories.has(category.name)
          
          return (
            <div key={category.id}>
              <div className="flex items-center">
                <Link
                  href={`/categories/${category.handle}`}
                  className={`block py-3 ${textSize} text-gray-600 ${hoverBg} hover:text-blue-600 transition-colors duration-150 flex-1`}
                  style={{ paddingLeft: `${paddingLeft * 4}px` }}
                  onClick={handleLinkClick}
                >
                  {category.name}
                </Link>
                
                {/* Toggle arrow for subcategories */}
                {hasChildren && (
                  <button
                    onClick={() => toggleCategory(category.name)}
                    className="px-4 py-3 text-gray-600 hover:text-blue-600 transition-colors duration-150"
                  >
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24" 
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Recursive rendering of children */}
              {hasChildren && isExpanded && category.category_children && (
                renderCategoryLevel(category.category_children, level + 1)
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-blue-600 transition-colors duration-200"
        aria-label="Menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          )}
        </svg>
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-36 left-0 right-0 bg-white border-t border-gray-100 z-50 max-h-[calc(100vh-144px)] overflow-y-auto">
            <nav className="py-6">
              
              {/* Shop with Dynamic Categories */}
              <div className="border-b border-gray-100">
                <div className="flex items-center">
                  <Link
                    href="/store"
                    className="block px-6 py-4 text-lg font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150 flex-1"
                    onClick={handleLinkClick}
                  >
                    Shop
                  </Link>
                  
                  {/* Toggle button for categories */}
                  {!loading && categories.length > 0 && (
                    <button
                      onClick={() => toggleCategory("Shop")}
                      className="px-6 py-4 text-gray-700 hover:text-blue-600 transition-colors duration-150"
                    >
                      <svg 
                        className={`w-5 h-5 transition-transform duration-200 ${expandedCategories.has("Shop") ? "rotate-180" : ""}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24" 
                        strokeWidth={1.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                  )}
                </div>
                
                {/* Dynamic Categories Submenu */}
                {!loading && categories.length > 0 && expandedCategories.has("Shop") && (
                  renderCategoryLevel(categories, 0)
                )}
              </div>

              {/* Static Navigation Items */}
              {staticNavigationItems.map((item) => (
                <div key={item.label} className="border-b border-gray-100 last:border-0">
                  <Link
                    href={item.href}
                    className="block px-6 py-4 text-lg font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                    onClick={handleLinkClick}
                  >
                    {item.label}
                  </Link>
                </div>
              ))}
            </nav>
          </div>
        </>
      )}
    </div>
  )
}
