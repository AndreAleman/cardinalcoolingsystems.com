"use client"

import { useState, useEffect } from "react"

export function useCartCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/cart/count')
        
        if (!res.ok) {
          console.error('Cart count API error:', res.status)
          return
        }
        
        const data = await res.json()
        setCount(data.count || 0)
      } catch (error) {
        console.error('Failed to fetch cart count:', error)
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 3000)
    return () => clearInterval(interval)
  }, [])

  return count
}
