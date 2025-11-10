import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export function BlogFormSkeleton() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="rounded-none px-4 py-2 h-auto hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to posts
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <Skeleton className="h-9 w-48" />
      </div>

      <div className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-12 w-full" />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-3 w-32" />
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-24 w-full" />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-96 w-full" />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-6 border-t border-border">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  )
}
