"use client"

import { useState } from "react"

export type FaqItem = { question: string; answer: string }

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="divide-y divide-gray-100">
      {faqs.map((faq, idx) => (
        <div key={idx}>
          <button
            className="w-full flex items-center justify-between py-5 text-left gap-4"
            onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
            aria-expanded={openIndex === idx}
          >
            <span className="text-sm font-medium leading-snug" style={{ color: "#111111" }}>
              {faq.question}
            </span>
            <span
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center transition-transform duration-200"
              style={{ transform: openIndex === idx ? "rotate(45deg)" : "rotate(0deg)", color: "#E3000F" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </button>
          {openIndex === idx && (
            <div className="pb-5">
              <p className="text-sm font-light leading-relaxed" style={{ color: "#555555" }}>
                {faq.answer}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
