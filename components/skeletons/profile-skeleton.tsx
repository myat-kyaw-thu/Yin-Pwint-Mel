export function ProfileSkeleton() {
  return (
    <div className="w-80 border-l border-border p-6 animate-pulse">
      <div className="space-y-6">
        {/* Profile Image */}
        <div className="w-24 h-24 bg-muted rounded-full mx-auto"></div>

        {/* Username */}
        <div className="h-6 bg-muted rounded w-32 mx-auto"></div>

        {/* Bio */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>

        {/* Social Links */}
        <div className="space-y-3">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-4/5"></div>
          <div className="h-4 bg-muted rounded w-full"></div>
        </div>

        {/* Stats */}
        <div className="flex justify-around pt-4 border-t border-border">
          <div className="text-center space-y-2">
            <div className="h-6 bg-muted rounded w-12 mx-auto"></div>
            <div className="h-3 bg-muted rounded w-16"></div>
          </div>
          <div className="text-center space-y-2">
            <div className="h-6 bg-muted rounded w-12 mx-auto"></div>
            <div className="h-3 bg-muted rounded w-16"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
