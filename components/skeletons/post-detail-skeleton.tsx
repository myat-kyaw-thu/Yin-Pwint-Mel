export function PostDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8 space-y-4">
        <div className="h-10 bg-muted rounded w-3/4"></div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded w-32"></div>
            <div className="h-3 bg-muted rounded w-24"></div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4 mb-8">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-5/6"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4 py-4 border-y border-border mb-8">
        <div className="h-10 bg-muted rounded w-20"></div>
        <div className="h-10 bg-muted rounded w-20"></div>
        <div className="h-10 bg-muted rounded w-20"></div>
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <div className="h-6 bg-muted rounded w-32"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 bg-muted rounded-full shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-4/5"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
