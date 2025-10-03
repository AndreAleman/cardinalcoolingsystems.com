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
    const fields = [
      "id", "name", "handle", "description",
      "category_children.id", "category_children.name", "category_children.handle",
      "category_children.category_children.id", "category_children.category_children.name", "category_children.category_children.handle"
    ].join(",")

    sdk.store.category.list({
      fields,
      include_descendants_tree: true,
    }).then(({ product_categories }) => {
      setCategories(product_categories || [])
      setLoading(false)
    }).catch(error => {
      console.error("❌ Error loading categories:", error)
      setLoading(false)
    })
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

  const handleLinkClick = (hasChildren: boolean) => {
    // Only close menu if the category has no children (is a final destination)
    if (!hasChildren) {
      setIsOpen(false)
    }
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
                    onClick={() => setIsOpen(false)}
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
                  <div className="bg-gray-50">
                    {categories.map((category) => {
                      const hasChildren = category.category_children?.length > 0
                      
                      return (
                        <div key={category.id}>
                          {/* Main Category */}
                          <div className="flex items-center">
                            {hasChildren ? (
                              // If has children, make it a button to expand/collapse
                              <button
                                onClick={() => toggleCategory(category.name)}
                                className="block px-12 py-3 text-base text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 flex-1 text-left"
                              >
                                {category.name}
                              </button>
                            ) : (
                              // If no children, make it a regular link
                              <Link
                                href={`/categories/${category.handle}`}
                                className="block px-12 py-3 text-base text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors duration-150 flex-1"
                                onClick={() => handleLinkClick(false)}
                              >
                                {category.name}
                              </Link>
                            )}
                            
                            {/* Toggle arrow for subcategories */}
                            {hasChildren && (
                              <button
                                onClick={() => toggleCategory(category.name)}
                                className="px-4 py-3 text-gray-600 hover:text-blue-600 transition-colors duration-150"
                              >
                                <svg 
                                  className={`w-4 h-4 transition-transform duration-200 ${expandedCategories.has(category.name) ? "rotate-180" : ""}`} 
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
                          
                          {/* Subcategories */}
                          {hasChildren && expandedCategories.has(category.name) && (
                            <div className="bg-gray-100">
                              {category.category_children.map((subCategory) => {
                                const subHasChildren = subCategory.category_children?.length > 0
                                
                                return (
                                  <div key={subCategory.id}>
                                    <div className="flex items-center">
                                      {subHasChildren ? (
                                        <button
                                          onClick={() => toggleCategory(subCategory.name)}
                                          className="block px-16 py-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-blue-600 transition-colors duration-150 flex-1 text-left"
                                        >
                                          {subCategory.name}
                                        </button>
                                      ) : (
                                        <Link
                                          href={`/categories/${subCategory.handle}`}
                                          className="block px-16 py-2 text-sm text-gray-600 hover:bg-gray-200 hover:text-blue-600 transition-colors duration-150 flex-1"
                                          onClick={() => handleLinkClick(false)}
                                        >
                                          {subCategory.name}
                                        </Link>
                                      )}
                                      
                                      {subHasChildren && (
                                        <button
                                          onClick={() => toggleCategory(subCategory.name)}
                                          className="px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors duration-150"
                                        >
                                          <svg 
                                            className={`w-3 h-3 transition-transform duration-200 ${expandedCategories.has(subCategory.name) ? "rotate-180" : ""}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24" 
                                            strokeWidth={2}
                                          >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                          </svg>
                                        </button>
                                      )}
                                    </div>
                                    
                                    {/* Third level categories */}
                                    {subHasChildren && expandedCategories.has(subCategory.name) && (
                                      <div className="bg-gray-200">
                                        {subCategory.category_children.map((thirdLevel) => (
                                          <Link
                                            key={thirdLevel.id}
                                            href={`/categories/${thirdLevel.handle}`}
                                            className="block px-20 py-2 text-xs text-gray-600 hover:bg-gray-300 hover:text-blue-600 transition-colors duration-150"
                                            onClick={() => handleLinkClick(false)}
                                          >
                                            {thirdLevel.name}
                                          </Link>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Static Navigation Items */}
              {staticNavigationItems.map((item) => (
                <div key={item.label} className="border-b border-gray-100 last:border-0">
                  <Link
                    href={item.href}
                    className="block px-6 py-4 text-lg font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors duration-150"
                    onClick={() => setIsOpen(false)}
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
