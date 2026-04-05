"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import SortProducts, { SortOptions } from "./sort-products"
import FilterCategories from "./filter-categories"

type RefinementListProps = {
  sortBy: SortOptions
  search?: boolean
  "data-testid"?: string
}

const RefinementList = ({ sortBy, "data-testid": dataTestId }: RefinementListProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const setQueryParams = (name: string, value: string) => {
    const query = createQueryString(name, value)
    router.push(`${pathname}?${query}`)
  }

  // Count active filters for badge
  const activeCount = [
    searchParams.get("category_id"),
    searchParams.get("material"),
    searchParams.get("size"),
  ].filter(Boolean).length

  const FilterContent = (
    <div className="flex flex-col gap-6">
      <SortProducts sortBy={sortBy} setQueryParams={setQueryParams} data-testid={dataTestId} />
      <div className="border-t border-gray-100" />
      <FilterCategories setQueryParams={setQueryParams} />
    </div>
  )

  return (
    <>
      {/* ── Mobile: Filter & Sort button ─────────────────────────────────── */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border border-gray-200 bg-white transition-colors hover:border-gray-400"
          style={{ borderRadius: "5px" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          Filter &amp; Sort
          {activeCount > 0 && (
            <span
              className="flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: "#E3000F", borderRadius: "50%" }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Mobile: Drawer overlay ────────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer panel */}
          <div
            className="fixed top-0 left-0 h-full w-[320px] max-w-[90vw] z-50 bg-white overflow-y-auto lg:hidden"
            style={{ boxShadow: "4px 0 24px rgba(0,0,0,0.12)" }}
          >
            {/* Drawer header */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white"
            >
              <span className="text-sm font-semibold" style={{ color: "#111111" }}>
                Filter &amp; Sort
                {activeCount > 0 && (
                  <span
                    className="ml-2 inline-flex items-center justify-center w-5 h-5 text-[10px] font-semibold text-white"
                    style={{ backgroundColor: "#E3000F", borderRadius: "50%" }}
                  >
                    {activeCount}
                  </span>
                )}
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-900 transition-colors"
                aria-label="Close filters"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Drawer content */}
            <div className="px-6 py-6">
              {FilterContent}
            </div>

            {/* Drawer footer */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-full py-3 text-sm font-medium text-white transition-all duration-200"
                style={{ backgroundColor: "#E3000F", borderRadius: "5px" }}
              >
                View Results
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Desktop: Sidebar ──────────────────────────────────────────────── */}
      <div className="hidden lg:block flex-shrink-0 w-[280px]">
        {FilterContent}
      </div>
    </>
  )
}

export default RefinementList
