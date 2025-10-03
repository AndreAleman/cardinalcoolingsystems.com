import { useEffect, useRef, useState } from "react"

export function useCarousel() {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const handler = () => {
      const p = el.scrollLeft / (el.scrollWidth - el.clientWidth)
      setProgress(p)
    }
    el.addEventListener("scroll", handler)
    return () => el.removeEventListener("scroll", handler)
  }, [])

  return { ref, progress }
}
