"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Label, Text, Checkbox, clx } from "@medusajs/ui"

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

const categories = [
  { id: 'pcat_01K0AZA2PHMYJABBFRR6RJPSHQ', value: 'shirts', label: 'Shirts' }, 
  { id: 'pcat_01K0AZA2PJC04PC34FEKKX4N35', value: 'sweatshirts', label: 'Sweatshirts' }, 
  // Add your other categories here with their actual IDs
]

const materials = [
  { value: 'T304', label: 'T304 Stainless Steel' },
  { value: 'T304L', label: 'T304L Stainless Steel' },
  { value: 'T316', label: 'T316 Stainless Steel' },
  { value: 'T316L', label: 'T316L Stainless Steel' },
]

const sizes = [
  { value: '1/2', label: '1/2"' },
  { value: '3/4', label: '3/4"' },
  { value: '1', label: '1"' },
  { value: '1-1/4', label: '1-1/4"' },
  { value: '1-1/2', label: '1-1/2"' },
  { value: '2', label: '2"' },
  { value: '2-1/2', label: '2-1/2"' },
  { value: '3', label: '3"' },
  { value: '4', label: '4"' },
  { value: '5', label: '5"' },
  { value: '6', label: '6"' },
  { value: '8', label: '8"' },
  { value: '10', label: '10"' },
  { value: '12', label: '12"' },
]

const FilterCategories = ({ setQueryParams, "data-testid": dataTestId }: FilterCategoriesProps) => {
  // CHANGED: Start with all sections expanded by default
  const [expandedSections, setExpandedSections] = useState<string[]>(['categories', 'materials', 'sizes'])
  const searchParams = useSearchParams()

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

  // Get active filters
  const activeFilters = []
  const categoryId = searchParams.get("category_id")
  const material = searchParams.get("material")
  const size = searchParams.get("size")
  
  if (categoryId) {
    const categoryLabel = categories.find(cat => cat.id === categoryId)?.label || categoryId
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

      {/* Categories Section */}
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
          <div className="flex flex-col gap-y-2 max-h-48 overflow-y-auto">
            {categories.map((category) => {
              const isChecked = searchParams.get("category_id") === category.id
              return (
                <div key={category.id} className="flex gap-x-2 items-center">
                  <Checkbox
                    id={category.id}
                    checked={isChecked}
                    onCheckedChange={(checked) => handleFilterChange("category", category.id, !!checked)}
                  />
                  <Label
                    htmlFor={category.id}
                    className={clx(
                      "!txt-compact-small !transform-none text-ui-fg-subtle hover:cursor-pointer",
                      {
                        "text-ui-fg-base": isChecked,
                      }
                    )}
                  >
                    {category.label}
                  </Label>
                </div>
              )
            })}
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
          <div className="flex flex-col gap-y-2">
            {materials.map((material) => {
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
                      {
                        "text-ui-fg-base": isChecked,
                      }
                    )}
                  >
                    {material.label}
                  </Label>
                </div>
              )
            })}
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
            {sizes.map((size) => {
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
                      {
                        "text-ui-fg-base": isChecked,
                      }
                    )}
                  >
                    {size.label}
                  </Label>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterCategories
