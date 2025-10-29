export function PostListSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-border p-6 animate-pulse">
          <div className="space-y-4">
            {/* Author info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-muted rounded-full"></div>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-24"></div>
                <div className="h-3 bg-muted rounded w-20"></div>
              </div>
            </div>

            {/* Title */}
            <div className="h-8 bg-muted rounded w-3/4"></div>

            {/* Excerpt */}
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 pt-2">
              <div className="h-8 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
              <div className="h-8 bg-muted rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
