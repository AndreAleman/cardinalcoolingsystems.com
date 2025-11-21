"use client"

import React, { useState } from "react"
import BulkPricingModal from "@modules/products/components/bulk-pricing-modal"

const DISCOUNTS = [
  { percent: "5%", qty: "10+", dollars: "$100+" },
  { percent: "??%", qty: "25+", dollars: "$300+" },
  { percent: "??%", qty: "50+", dollars: "$750+" },
  { percent: "??%", qty: "100+", dollars: "$1,500+" },
  { percent: "??%", qty: "200+", dollars: "$3,000+" },
]

const DiscountTable = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="my-6">
        <table className="w-full text-sm bg-white border rounded">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 font-medium text-left">Discount %</th>
              <th className="py-2 px-4 font-medium text-left">Qty Purchased</th>
              <th className="py-2 px-4 font-medium text-left">Dollars Spent</th>
            </tr>
          </thead>
          <tbody>
            {DISCOUNTS.map((row, i) => (
              <tr key={row.qty}>
                <td className={`py-2 px-4 ${i === 0 ? "text-orange-600 font-bold" : "text-gray-400 blur-sm"}`}>
                  {row.percent}
                </td>
                <td className={`py-2 px-4 ${i === 0 ? "text-black" : "text-gray-400 blur-sm"}`}>
                  {row.qty}
                </td>
                <td className={`py-2 px-4 ${i === 0 ? "text-black" : "text-gray-400 blur-sm"}`}>
                  {row.dollars}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="mt-3 px-4 py-2 bg-orange-600 text-white font-bold rounded hover:bg-orange-700 transition"
        >
          Unlock Bulk Pricing
        </button>
        <div className="mt-2 text-xs text-gray-500 italic">
          Excludes freight shipments. Call or email for custom rates above 5%.
        </div>
      </div>

      <BulkPricingModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}

export default DiscountTable
