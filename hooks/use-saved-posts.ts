import { useQuery } from "@tanstack/react-query"
import { getSavedPosts } from "@/lib/actions/saved-posts.actions"

// Query keys
export const savedPostsKeys = {
  all: ["saved-posts"] as const,
  lists: () => [...savedPostsKeys.all, "list"] as const,
}

// Get saved posts
export function useSavedPosts() {
  return useQuery({
    queryKey: savedPostsKeys.lists(),
    queryFn: getSavedPosts,
  })
}
