"use client"

import { useSavedPosts } from "@/hooks/use-saved-posts"
import { PostList } from "@/components/post-list"
import { PostListSkeleton } from "@/components/skeletons/post-list-skeleton"
import { Bookmark } from "lucide-react"

export function SavedPostsContainer() {
  const { data: posts, isLoading, error } = useSavedPosts()

  if (isLoading) {
    return <PostListSkeleton />
  }

  if (error) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-muted-foreground">Failed to load saved posts. Please try again.</p>
      </div>
    )
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="border border-border p-12 text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">No saved posts yet</h3>
          <p className="text-muted-foreground">
            Start bookmarking posts to read them later
          </p>
        </div>
      </div>
    )
  }

  return <PostList posts={posts} />
}
