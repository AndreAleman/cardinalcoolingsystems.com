"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Label, Text, Checkbox, clx } from "@medusajs/ui"
import { sdk } from "@lib/config"
import { HttpTypes } from "@medusajs/types"

type FilterCategoriesProps = {
  setQueryParams: (name: string, value: string) => void
  "data-testid"?: string
}

// Inline SVG Icons
const ChevronDownMini = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
)

const ChevronUpMini = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
)

interface Category {
  id: string
  label: string
  children?: Category[]
}

const FilterCategories = ({ setQueryParams, "data-testid": dataTestId }: FilterCategoriesProps) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'materials', 'sizes'])
  const [categories, setCategories] = useState<Category[]>([])
  const [materials, setMaterials] = useState<Array<{ value: string; label: string }>>([])
  const [sizes, setSizes] = useState<Array<{ value: string; label: string }>>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const searchParams = useSearchParams()

  // Fetch categories with subcategories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await sdk.store.category.list({
          include_descendants_tree: true,
          fields: "id,name,handle,parent_category_id,category_children.id,category_children.name,category_children.handle"
        })
        
        const allCategories = response.product_categories || []
        const parentCategories = allCategories.filter(cat => 
          cat.parent_category_id === null || cat.parent_category_id === undefined
        )
        
        const formattedCategories: Category[] = parentCategories.map(cat => ({
          id: cat.id,
          label: cat.name,
          children: cat.category_children?.map(child => ({
            id: child.id,
            label: child.name,
            children: undefined
          }))
        }))
        
        setCategories(formattedCategories)
        setLoadingCategories(false)
      } catch (error) {
        console.error("❌ Error loading filter categories:", error)
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  // Fetch materials and sizes from product variants with option mapping
  useEffect(() => {
    const fetchProductOptions = async () => {
      try {
        // Fetch products with both product-level options AND variant options
        const response = await sdk.store.product.list({
          fields: "id,title,options.id,options.title,variants.id,variants.options.id,variants.options.value,variants.options.option_id",
          limit: 100
        })
        
        const products = response.products || []
        console.log('📦 Products fetched:', products.length)
        
        const materialSet = new Set<string>()
        const sizeSet = new Set<string>()
        
        // Process each product
        products.forEach(product => {
          // Create a map of option_id to option title
          const optionMap = new Map<string, string>()
          product.options?.forEach(option => {
            if (option.id && option.title) {
              optionMap.set(option.id, option.title)
            }
          })
          
          // Now process variants with the option map
          product.variants?.forEach(variant => {
            variant.options?.forEach(option => {
              const optionTitle = option.option_id ? optionMap.get(option.option_id) : null
              const value = option.value
              
              if (value && optionTitle) {
                const titleLower = optionTitle.toLowerCase()
                
                // Check if this is a size option (must have "size" in title)
                if (titleLower.includes('size')) {
                  sizeSet.add(value)
                  console.log('📏 Found size:', value, 'from option:', optionTitle)
                }
                // Check if this is a material/alloy option
                else if (titleLower.includes('alloy') || titleLower.includes('material')) {
                  materialSet.add(value)
                  console.log('🔩 Found material:', value, 'from option:', optionTitle)
                }
                // Log others for debugging
                else {
                  console.log('⚪ Skipped:', value, 'from option:', optionTitle)
                }
              }
            })
          })
        })
        
        // Convert to sorted arrays
        const materialArray = Array.from(materialSet)
          .sort()
          .map(value => ({ value, label: value }))
        
        const sizeArray = Array.from(sizeSet)
          .sort((a, b) => {
            // Try to sort numerically
            const numA = parseFloat(a.replace(/[^0-9.]/g, ''))
            const numB = parseFloat(b.replace(/[^0-9.]/g, ''))
            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB
            }
            return a.localeCompare(b)
          })
          .map(value => ({ value, label: value }))
        
        console.log('✅ Materials found:', materialArray.length, materialArray)
        console.log('✅ Sizes found:', sizeArray.length, sizeArray)
        
        setMaterials(materialArray)
        setSizes(sizeArray)
        setLoadingOptions(false)
      } catch (error) {
        console.error("❌ Error loading product options:", error)
        setLoadingOptions(false)
      }
    }

    fetchProductOptions()
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleFilterChange = (filterType: string, value: string, checked: boolean) => {
    const paramName = filterType === 'category' ? 'category_id' : filterType
    setQueryParams(paramName, checked ? value : "")
  }

  const clearAllFilters = () => {
    setQueryParams("category_id", "")
    setQueryParams("material", "")
    setQueryParams("size", "")
  }

  const flattenCategories = (cats: Category[]): Array<{ id: string; label: string }> => {
    const result: Array<{ id: string; label: string }> = []
    cats.forEach(cat => {
      result.push({ id: cat.id, label: cat.label })
      if (cat.children) {
        cat.children.forEach(child => {
          result.push({ id: child.id, label: child.label })
        })
      }
    })
    return result
  }

  const activeFilters = []
  const categoryId = searchParams.get("category_id")
  const material = searchParams.get("material")
  const size = searchParams.get("size")
  
  if (categoryId) {
    const flatCats = flattenCategories(categories)
    const categoryLabel = flatCats.find(cat => cat.id === categoryId)?.label || categoryId
    activeFilters.push(`Category: ${categoryLabel}`)
  }
  if (material) activeFilters.push(`Material: ${material}`)
  if (size) activeFilters.push(`Size: ${size}`)

  return (
    <div className="flex gap-x-3 flex-col gap-y-6" data-testid={dataTestId}>
      <Text className="txt-compact-small-plus text-ui-fg-muted">Filter Products</Text>
      
      {/* Active Filters */}
      {activeFilters.length > 0 && (
        <div className="bg-ui-bg-subtle p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <Text className="txt-compact-small-plus text-ui-fg-base">
              Active Filters ({activeFilters.length})
            </Text>
            <button 
              onClick={clearAllFilters}
              className="txt-compact-small text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {activeFilters.map((filter) => (
              <div key={filter} className="flex items-center justify-between bg-ui-bg-base px-3 py-2 rounded border">
                <Text className="txt-compact-small text-ui-fg-base">{filter}</Text>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Section with Subcategories */}
      <div className="flex flex-col gap-y-3">
        <button
          onClick={() => toggleSection("categories")}
          className="flex items-center justify-between w-full text-left group"
        >
          <Text className="txt-compact-small-plus text-ui-fg-muted">Product Categories</Text>
          {expandedSections.includes("categories") ? (
            <ChevronUpMini className="text-ui-fg-muted group-hover:text-ui-fg-base transition-colors" />
          ) : (
            <ChevronDownMini className="text-ui-fg-muted group-hover:text-ui-fg-base transition-colors" />
          )}
        </button>

        {expandedSections.includes("categories") && (
          <div className="flex flex-col gap-y-2 max-h-96 overflow-y-auto">
            {loadingCategories ? (
              <Text className="txt-compact-small text-ui-fg-subtle">Loading categories...</Text>
            ) : categories.length === 0 ? (
              <Text className="txt-compact-small text-ui-fg-subtle">No categories found</Text>
            ) : (
              categories.map((category) => {
                const isChecked = searchParams.get("category_id") === category.id
                return (
                  <div key={category.id} className="flex flex-col gap-y-2">
                    <div className="flex gap-x-2 items-center">
                      <Checkbox
                        id={category.id}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleFilterChange("category", category.id, !!checked)}
                      />
                      <Label
                        htmlFor={category.id}
                        className={clx(
                          "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer font-medium",
                          { "text-ui-fg-base": isChecked }
                        )}
                      >
                        {category.label}
                      </Label>
                    </div>
                    
                    {category.children && category.children.length > 0 && (
                      <div className="flex flex-col gap-y-2 ml-6">
                        {category.children.map((child) => {
                          const isChildChecked = searchParams.get("category_id") === child.id
                          return (
                            <div key={child.id} className="flex gap-x-2 items-center">
                              <Checkbox
                                id={child.id}
                                checked={isChildChecked}
                                onCheckedChange={(checked) => handleFilterChange("category", child.id, !!checked)}
                              />
                              <Label
                                htmlFor={child.id}
                                className={clx(
                                  "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer",
                                  { "text-ui-fg-base": isChildChecked }
                                )}
                              >
                                {child.label}
                              </Label>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Materials Section */}
      <div className="flex flex-col gap-y-3">
        <button
          onClick={() => toggleSection("materials")}
          className="flex items-center justify-between w-full text-left group"
        >
          <Text className="txt-compact-small-plus text-ui-fg-muted">Material</Text>
          {expandedSections.includes("materials") ? (
            <ChevronUpMini className="text-ui-fg-muted group-hover:text-ui-fg-base transition-colors" />
          ) : (
            <ChevronDownMini className="text-ui-fg-muted group-hover:text-ui-fg-base transition-colors" />
          )}
        </button>

        {expandedSections.includes("materials") && (
          <div className="flex flex-col gap-y-2 max-h-48 overflow-y-auto">
            {loadingOptions ? (
              <Text className="txt-compact-small text-ui-fg-subtle">Loading materials...</Text>
            ) : materials.length === 0 ? (
              <Text className="txt-compact-small text-ui-fg-subtle">No materials found</Text>
            ) : (
              materials.map((material) => {
                const isChecked = searchParams.get("material") === material.value
                return (
                  <div key={material.value} className="flex gap-x-2 items-center">
                    <Checkbox
                      id={material.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleFilterChange("material", material.value, !!checked)}
                    />
                    <Label
                      htmlFor={material.value}
                      className={clx(
                        "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer",
                        { "text-ui-fg-base": isChecked }
                      )}
                    >
                      {material.label}
                    </Label>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Sizes Section */}
      <div className="flex flex-col gap-y-3">
        <button
          onClick={() => toggleSection("sizes")}
          className="flex items-center justify-between w-full text-left group"
        >
          <Text className="txt-compact-small-plus text-ui-fg-muted">Size</Text>
          {expandedSections.includes("sizes") ? (
            <ChevronUpMini className="text-ui-fg-muted group-hover:text-ui-fg-base transition-colors" />
          ) : (
            <ChevronDownMini className="text-ui-fg-muted group-hover:text-ui-fg-base transition-colors" />
          )}
        </button>

        {expandedSections.includes("sizes") && (
          <div className="flex flex-col gap-y-2 max-h-48 overflow-y-auto">
            {loadingOptions ? (
              <Text className="txt-compact-small text-ui-fg-subtle">Loading sizes...</Text>
            ) : sizes.length === 0 ? (
              <Text className="txt-compact-small text-ui-fg-subtle">No sizes found</Text>
            ) : (
              sizes.map((size) => {
                const isChecked = searchParams.get("size") === size.value
                return (
                  <div key={size.value} className="flex gap-x-2 items-center">
                    <Checkbox
                      id={size.value}
                      checked={isChecked}
                      onCheckedChange={(checked) => handleFilterChange("size", size.value, !!checked)}
                    />
                    <Label
                      htmlFor={size.value}
                      className={clx(
                        "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer",
                        { "text-ui-fg-base": isChecked }
                      )}
                    >
                      {size.label}
                    </Label>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterCategories
