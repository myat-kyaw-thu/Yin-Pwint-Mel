import Link from "next/link"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-6 py-16">
      <div className="flex justify-center">
        <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
          <FileQuestion className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Blog Post Not Found</h1>
        <p className="text-muted-foreground text-lg">
          The blog post you're looking for doesn't exist or has been removed.
        </p>
      </div>

      <div className="flex gap-4 justify-center pt-4">
        <Link
          href="/"
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
