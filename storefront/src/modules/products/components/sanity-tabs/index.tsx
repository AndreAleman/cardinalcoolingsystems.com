// src/modules/products/components/sanity-tabs/index.tsx - UPDATED
'use client'

import React, { useState } from "react"
import { PortableText } from "@portabletext/react"
import ReactPlayer from "react-player"
import { urlFor } from '../../../../sanity/lib/image'

// Remove HtmlTab type - everything is now SanityTab
type SanityTab = {
  _key: string
  title: string
  content: any[]
}

const components = {
  types: {
    youtube: ({ value }: { value: { url: string } }) => {
      if (!value?.url) return <div>No YouTube URL provided</div>
      return (
        <div className="my-4">
          <ReactPlayer src={value.url} controls width="100%" height="400px" />
        </div>
      )
    },
    image: ({ value }: any) => {
      if (value?.asset) {
        const imgUrl = urlFor(value).width(800).auto('format').url()
        return (
          <div className="my-4">
            <img src={imgUrl} alt={value.alt || ''} className="max-w-full h-auto rounded shadow" loading="lazy" />
          </div>
        )
      } else if (value?.url) {
        // Handle converted HTML images with direct URLs - ADD SIZE CONTROL HERE
        return (
          <div className="my-4">
            <img 
              src={value.url} 
              alt={value.alt || ''} 
              className="max-w-full h-auto rounded shadow" 
              style={{
                maxWidth: '400px',        // ← CONTROL IMAGE SIZE HERE
                width: '100%',
                height: 'auto'
              }}
              loading="lazy" 
            />
          </div>
        )
      }
      return <div>No image</div>
    },
    // ADD THIS: productTable component for converted HTML tables
    productTable: ({ value }: any) => (
      <div className="my-6 overflow-auto">
        <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
          <tbody>
            {value.rows?.map((row: any, i: number) => (
              <tr key={i} className={i === 0 ? "bg-gray-50" : ""}>
                {row.cells?.map((cell: any, j: number) => (
                  <td
                    key={j}
                    colSpan={cell.colspan || 1}
                    rowSpan={cell.rowspan || 1}
                    className="border border-gray-300 px-4 py-2 text-sm min-h-[40px]"
                  >
                    {cell.text || '\u00A0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    // Keep existing table component for compatibility
    table: ({ value }: any) => (
      <div className="my-6 overflow-auto">
        <table className="min-w-full border-collapse border border-gray-300 rounded-lg">
          <tbody>
            {value.rows?.map((row: any, i: number) => (
              <tr key={i} className={i === 0 ? "bg-gray-50" : ""}>
                {row.cells?.map((cell: any, j: number) => (
                  <td
                    key={j}
                    colSpan={cell.colspan || 1}
                    rowSpan={cell.rowspan || 1}
                    className="border border-gray-300 px-4 py-2 text-sm min-h-[40px]"
                  >
                    {cell.text || '\u00A0'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
}

export default function SanityTabs({ tabs }: { tabs: SanityTab[] }) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (!tabs?.length) return null

  return (
    <div>
      <div className="flex border-b gap-2 mb-4">
        {tabs.map((tab, idx) => (
          <button
            key={tab._key}
            onClick={() => setActiveIdx(idx)}
            className={`px-4 py-2 transition border-b-2 ${
              activeIdx === idx ? "border-blue-600 font-bold" : "border-transparent"
            }`}
            type="button"
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {tabs.map((tab, idx) => (
          <div
            key={tab._key}
            style={{ display: activeIdx === idx ? 'block' : 'none' }}
          >
            <div className="prose prose-lg max-w-none">
              <PortableText value={tab.content} components={components} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
