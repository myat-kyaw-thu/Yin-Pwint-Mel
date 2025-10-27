"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Post page error:", error)
  }, [error])

  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-12 h-12 text-destructive" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Something Went Wrong</h1>
        <p className="text-muted-foreground text-lg">
          We encountered an error while loading this blog post.
        </p>
      </div>

      <div className="flex gap-4 justify-center pt-4">
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 border border-border rounded-md hover:bg-muted transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
