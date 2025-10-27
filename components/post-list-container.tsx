"use client"

import { useEffect, useMemo } from "react"
import { usePosts } from "@/hooks/use-blog"
import { PostList } from "@/components/post-list"
import { PostListSkeleton } from "@/components/skeletons/post-list-skeleton"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"
import { Loader2 } from "lucide-react"

export function PostListContainer() {
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = usePosts()

  const { ref, entry } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: "100px",
  })

  // Flatten all pages into a single array
  const posts = useMemo(() => {
    return data?.pages.flatMap((page) => page.posts) ?? []
  }, [data])

  // Load more when intersection observer triggers
  useEffect(() => {
    if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [entry?.isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isLoading) {
    return <PostListSkeleton />
  }

  if (error) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-muted-foreground">Failed to load posts. Please try again.</p>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="border border-border p-8 text-center">
        <p className="text-muted-foreground">No posts yet. Create your first post!</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <PostList posts={posts} />

      {/* Intersection observer trigger */}
      <div ref={ref} className="flex justify-center py-8">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading more posts...</span>
          </div>
        )}
        {!hasNextPage && posts.length > 0 && (
          <p className="text-sm text-muted-foreground">You've reached the end</p>
        )}
      </div>
    </div>
  )
}
