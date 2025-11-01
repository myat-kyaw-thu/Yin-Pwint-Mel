import { useMutation, useQueryClient } from "@tanstack/react-query"
import { likePost, unlikePost, savePost, unsavePost } from "@/lib/actions/interaction.actions"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { blogKeys } from "./use-blog"
import { savedPostsKeys } from "./use-saved-posts"

// Like post mutation
export function useLikePost() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ postId, isLiked }: { postId: string; isLiked: boolean }) => {
      if (isLiked) {
        return unlikePost(postId)
      }
      return likePost(postId)
    },
    onMutate: async ({ postId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: blogKeys.lists() })

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(blogKeys.lists())

      // Optimistically update (for infinite query)
      queryClient.setQueriesData({ queryKey: blogKeys.lists() }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post.id === postId
                ? {
                  ...post,
                  is_liked: !isLiked,
                  likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
                }
                : post
            ),
          })),
        }
      })

      return { previousPosts }
    },
    onSuccess: (result) => {
      if (result?.requiresAuth) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to like posts",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      if (result?.error) {
        toast({
          title: "Action Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(blogKeys.lists(), context.previousPosts)
      }
      toast({
        title: "Action Failed",
        description: "Failed to update like status",
        variant: "destructive",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() })
    },
  })
}

// Save post mutation
export function useSavePost() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: async ({ postId, isSaved }: { postId: string; isSaved: boolean }) => {
      if (isSaved) {
        return unsavePost(postId)
      }
      return savePost(postId)
    },
    onMutate: async ({ postId, isSaved }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: blogKeys.lists() })

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(blogKeys.lists())

      // Optimistically update (for infinite query)
      queryClient.setQueriesData({ queryKey: blogKeys.lists() }, (old: any) => {
        if (!old?.pages) return old
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) =>
              post.id === postId
                ? {
                  ...post,
                  is_saved: !isSaved,
                }
                : post
            ),
          })),
        }
      })

      return { previousPosts }
    },
    onSuccess: (result) => {
      if (result?.requiresAuth) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to save posts",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      if (result?.error) {
        toast({
          title: "Action Failed",
          description: result.error,
          variant: "destructive",
        })
      }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPosts) {
        queryClient.setQueryData(blogKeys.lists(), context.previousPosts)
      }
      toast({
        title: "Action Failed",
        description: "Failed to update save status",
        variant: "destructive",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() })
      queryClient.invalidateQueries({ queryKey: savedPostsKeys.lists() })
    },
  })
}
