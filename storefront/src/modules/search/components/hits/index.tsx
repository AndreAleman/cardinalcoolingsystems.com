import { clx } from "@medusajs/ui"
import React from "react"
import {
  UseHitsProps,
  useHits,
  useSearchBox,
} from "react-instantsearch-hooks-web"

import { ProductHit } from "../hit"
import ShowAll from "../show-all"

type HitsProps<THit> = React.ComponentProps<"div"> &
  UseHitsProps & {
    hitComponent: (props: { hit: THit }) => JSX.Element
  }

const Hits = ({
  hitComponent: Hit,
  className,
  ...props
}: HitsProps<ProductHit>) => {
  const { query } = useSearchBox()
  const { hits } = useHits(props)

  return (
    <div
      className={clx(
        "transition-[height,max-height,opacity] duration-300 ease-in-out sm:overflow-hidden w-full sm:w-[50vw] mb-1 p-px",
        className,
        {
          // Show results if there's a query OR if there are hits
          "max-h-full opacity-100": !!query || hits.length > 0,
          "max-h-0 opacity-0": !query && !hits.length,
        }
      )}
    >
      {/* Show results even while typing */}
      {hits.length > 0 && (
        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4"
          data-testid="search-results"
        >
          {hits.slice(0, 6).map((hit, index) => (
            <li
              key={hit.objectID || index}
              className={clx("list-none", {
                "hidden sm:block": index > 2,
              })}
            >
              <Hit hit={hit as unknown as ProductHit} />
            </li>
          ))}
        </div>
      )}
      
      {/* Show "no results" message if query exists but no hits */}
      {query && hits.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No results found for "{query}"
        </div>
      )}
      
      {/* Show "Show All" button when there are results */}
      {hits.length > 0 && <ShowAll />}
    </div>
  )
}

export default Hits
