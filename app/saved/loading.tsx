import { PostListSkeleton } from "@/components/skeletons/post-list-skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-4">
        <div className="h-9 bg-muted rounded w-48 mb-2"></div>
        <div className="h-5 bg-muted rounded w-64"></div>
      </div>
      <PostListSkeleton />
    </div>
  )
}
