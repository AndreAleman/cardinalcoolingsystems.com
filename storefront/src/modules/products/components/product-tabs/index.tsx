"use client"

import * as AccordionPrimitive from "@radix-ui/react-accordion"
import React, { useState, useEffect } from "react"
import { HttpTypes } from "@medusajs/types"
import { PortableText } from "@portabletext/react"
import ReactPlayer from "react-player"
import { urlFor } from "../../../../sanity/lib/image"

// ── Sanity PortableText components ───────────────────────────────────────────

const portableTextComponents = {
  types: {
    youtube: ({ value }: { value: { url: string } }) => {
      if (!value?.url) return null
      return (
        <div className="my-4">
          <ReactPlayer src={value.url} controls width="100%" height="400px" />
        </div>
      )
    },
    image: ({ value }: any) => {
      if (value?.asset) {
        const imgUrl = urlFor(value).width(800).auto("format").url()
        return (
          <div className="my-4">
            <img src={imgUrl} alt={value.alt || ""} className="max-w-full h-auto" style={{ borderRadius: "5px" }} loading="lazy" />
          </div>
        )
      } else if (value?.url) {
        return (
          <div className="my-4">
            <img src={value.url} alt={value.alt || ""} className="max-w-full h-auto" style={{ maxWidth: "400px", width: "100%", borderRadius: "5px" }} loading="lazy" />
          </div>
        )
      }
      return null
    },
    productTable: ({ value }: any) => (
      <div className="my-4 overflow-auto">
        <div className="overflow-hidden border border-gray-200" style={{ borderRadius: "5px" }}>
          <table className="min-w-full border-collapse text-sm">
            <tbody className="divide-y divide-gray-100">
              {value.rows?.map((row: any, i: number) => (
                <tr key={i} style={i === 0 ? { backgroundColor: "#f8f8f8" } : {}}>
                  {row.cells?.map((cell: any, j: number) => (
                    <td
                      key={j}
                      colSpan={cell.colspan || 1}
                      rowSpan={cell.rowspan || 1}
                      className="px-4 py-2.5 text-sm"
                      style={{ color: i === 0 ? "#6b7280" : "#111111", fontWeight: i === 0 ? 500 : 400 }}
                    >
                      {cell.text || "\u00A0"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
    table: ({ value }: any) => (
      <div className="my-4 overflow-auto">
        <div className="overflow-hidden border border-gray-200" style={{ borderRadius: "5px" }}>
          <table className="min-w-full border-collapse text-sm">
            <tbody className="divide-y divide-gray-100">
              {value.rows?.map((row: any, i: number) => (
                <tr key={i} style={i === 0 ? { backgroundColor: "#f8f8f8" } : {}}>
                  {row.cells?.map((cell: any, j: number) => (
                    <td key={j} className="px-4 py-2.5 text-sm" style={{ color: i === 0 ? "#6b7280" : "#111111" }}>
                      {cell.text || "\u00A0"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    ),
  },
  block: {
    normal: ({ children }: any) => <p className="mb-4 text-sm font-light leading-relaxed" style={{ color: "#374151" }}>{children}</p>,
    h2: ({ children }: any) => <h2 className="text-lg font-semibold mt-6 mb-3" style={{ color: "#111111" }}>{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-semibold mt-4 mb-2" style={{ color: "#111111" }}>{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-sm font-semibold mt-3 mb-2" style={{ color: "#111111" }}>{children}</h4>,
    blockquote: ({ children }: any) => (
      <blockquote className="pl-4 my-4 italic text-sm font-light" style={{ borderLeft: "3px solid #E3000F", color: "#6b7280" }}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }: any) => <ul className="list-disc list-inside mb-4 space-y-1 text-sm" style={{ color: "#374151" }}>{children}</ul>,
    number: ({ children }: any) => <ol className="list-decimal list-inside mb-4 space-y-1 text-sm" style={{ color: "#374151" }}>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }: any) => <li className="leading-relaxed font-light">{children}</li>,
    number: ({ children }: any) => <li className="leading-relaxed font-light">{children}</li>,
  },
  marks: {
    strong: ({ children }: any) => <strong className="font-semibold" style={{ color: "#111111" }}>{children}</strong>,
    em: ({ children }: any) => <em className="italic">{children}</em>,
    link: ({ children, value }: any) => (
      <a href={value?.href} className="underline underline-offset-2 hover:opacity-80 transition-opacity" style={{ color: "#E3000F" }}
        target={value?.blank ? "_blank" : undefined}
        rel={value?.blank ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    ),
  },
}

// ── Accordion ────────────────────────────────────────────────────────────────

type AccordionItemProps = AccordionPrimitive.AccordionItemProps & {
  title: string
  children: React.ReactNode
}

const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, ...props }) => (
  // @ts-expect-error
  <AccordionPrimitive.Item {...props} className="border-b border-gray-200 last:border-b-0">
    {/* @ts-expect-error */}
    <AccordionPrimitive.Header>
      {/* @ts-expect-error */}
      <AccordionPrimitive.Trigger className="group flex w-full items-center justify-between py-4 text-left">
        <span className="text-sm font-medium" style={{ color: "#111111" }}>{title}</span>
        <svg
          className="w-4 h-4 flex-shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180"
          style={{ color: "#9ca3af" }}
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
    {/* @ts-expect-error */}
    <AccordionPrimitive.Content className="overflow-hidden data-[state=open]:animate-accordion-slide-down data-[state=closed]:animate-accordion-slide-up">
      <div className="pb-5">{children}</div>
    </AccordionPrimitive.Content>
  </AccordionPrimitive.Item>
)

// ── Tab content ───────────────────────────────────────────────────────────────

type ProductTabsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant | null
  technicalDetails?: any[]
}

const ProductInfoTab = ({ product, variant }: { product: HttpTypes.StoreProduct; variant?: HttpTypes.StoreProductVariant | null }) => {
  const displayData = variant || product
  const rows = [
    ...(variant ? [
      { label: "SKU", value: variant.sku || "—" },
      { label: "Variant", value: variant.title || "—" },
    ] : []),
    { label: "Weight", value: displayData.weight ? `${displayData.weight} g` : "—" },
    { label: "Length", value: displayData.length ? `${displayData.length}` : "—" },
    { label: "Width", value: displayData.width ? `${displayData.width}` : "—" },
    { label: "Height", value: displayData.height ? `${displayData.height}` : "—" },
  ].filter((r) => r.value !== "—")

  if (rows.length === 0) {
    return <p className="text-sm font-light" style={{ color: "#9ca3af" }}>No additional product information available.</p>
  }

  return (
    <div className="overflow-hidden border border-gray-200" style={{ borderRadius: "5px" }}>
      <table className="w-full text-sm">
        <thead style={{ backgroundColor: "#f8f8f8" }}>
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "#6b7280" }}>Specification</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium" style={{ color: "#6b7280" }}>Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="px-4 py-2.5 text-sm font-light" style={{ color: "#6b7280" }}>{row.label}</td>
              <td className="px-4 py-2.5 text-sm" style={{ color: "#111111" }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const ShippingInfoTab = () => {
  const items = [
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
      title: "Fast delivery",
      description: "Your package will arrive in 3-5 business days at your pick up location or in the comfort of your home.",
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ),
      title: "Simple exchanges",
      description: "Is the fit not quite right? No worries — we'll exchange your product for a new one.",
    },
    {
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
        </svg>
      ),
      title: "Easy returns",
      description: "Just return your product and we'll refund your money. No questions asked — we'll do our best to make sure your return is hassle-free.",
    },
  ]

  return (
    <div className="flex flex-col gap-y-5">
      {items.map((item) => (
        <div key={item.title} className="flex items-start gap-3">
          <div className="w-7 h-7 flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: "rgba(227,0,15,0.08)", color: "#E3000F", borderRadius: "5px" }}>
            {item.icon}
          </div>
          <div>
            <p className="text-sm font-medium mb-1" style={{ color: "#111111" }}>{item.title}</p>
            <p className="text-sm font-light leading-relaxed" style={{ color: "#6b7280" }}>{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const ProductTabs = ({ product, variant: initialVariant, technicalDetails }: ProductTabsProps) => {
  const [activeVariant, setActiveVariant] = useState(initialVariant)

  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail?.variant) {
        setActiveVariant(customEvent.detail.variant)
      }
    }
    window.addEventListener("variant-selected", handler)
    return () => window.removeEventListener("variant-selected", handler)
  }, [])

  // Build default open tabs
  const defaultOpen = ["Product Information"]
  if (technicalDetails && technicalDetails.length > 0) {
    defaultOpen.push("Technical Details")
  }

  return (
    <div className="w-full">
      {/* @ts-expect-error */}
      <AccordionPrimitive.Root type="multiple" defaultValue={defaultOpen}>

        {/* Technical Details — only shown if Sanity content exists */}
        {technicalDetails && technicalDetails.length > 0 && (
          <AccordionItem title="Technical Details" value="Technical Details">
            <PortableText value={technicalDetails} components={portableTextComponents} />
          </AccordionItem>
        )}

        <AccordionItem title="Product Information" value="Product Information">
          <ProductInfoTab product={product} variant={activeVariant} />
        </AccordionItem>

        <AccordionItem title="Shipping & Returns" value="Shipping & Returns">
          <ShippingInfoTab />
        </AccordionItem>

      </AccordionPrimitive.Root>
    </div>
  )
}

export default ProductTabs
