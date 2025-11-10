import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getTags, addTagsToPost, getPostTags } from "@/lib/actions/tag.actions"

export const tagKeys = {
  all: ["tags"] as const,
  lists: () => [...tagKeys.all, "list"] as const,
  postTags: (postId: string) => [...tagKeys.all, "post", postId] as const,
}

// Get all tags
export function useTags() {
  return useQuery({
    queryKey: tagKeys.lists(),
    queryFn: getTags,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

// Get tags for a specific post
export function usePostTags(postId: string) {
  return useQuery({
    queryKey: tagKeys.postTags(postId),
    queryFn: () => getPostTags(postId),
    enabled: !!postId,
  })
}

// Add tags to post
export function useAddTagsToPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ postId, tagIds }: { postId: string; tagIds: string[] }) =>
      addTagsToPost(postId, tagIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: tagKeys.postTags(variables.postId) })
      queryClient.invalidateQueries({ queryKey: ["posts"] })
    },
    onError: (error) => {
      console.error("Error adding tags to post:", error)
    },
  })
}
