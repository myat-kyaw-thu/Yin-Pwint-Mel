import { useEffect, useRef, useState } from "react"

interface UseIntersectionObserverOptions {
  threshold?: number
  root?: Element | null
  rootMargin?: string
  enabled?: boolean
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = "0px",
  enabled = true,
}: UseIntersectionObserverOptions = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry>()
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setEntry(entry)
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, enabled])

  return { ref: elementRef, entry }
}
