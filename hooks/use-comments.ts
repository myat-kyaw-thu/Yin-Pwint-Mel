import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createComment, updateComment, deleteComment } from "@/lib/actions/comment.actions"
import type { CreateCommentInput, UpdateCommentInput } from "@/lib/actions/comment.actions"
import { useRouter } from "next/navigation"
import { toast } from "@/hooks/use-toast"
import { blogKeys } from "./use-blog"

// Create comment mutation
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: createComment,
    onMutate: async (newComment: CreateCommentInput) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [...blogKeys.all, "comments", postId] })

      // Snapshot previous value
      const previousComments = queryClient.getQueryData([...blogKeys.all, "comments", postId])

      // Get current user profile from cache or create minimal profile
      const currentUserProfile = {
        id: newComment.author_id,
        username: "You",
        profile_image: null,
      }

      // Optimistically add new comment
      queryClient.setQueryData([...blogKeys.all, "comments", postId], (old: any) => {
        if (!old) return [
          {
            id: `temp-${Date.now()}`,
            content: newComment.content,
            author_id: newComment.author_id,
            post_id: newComment.post_id,
            parent_id: newComment.parent_id || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profiles: currentUserProfile,
            _optimistic: true,
          }
        ]

        const optimisticComment = {
          id: `temp-${Date.now()}`,
          content: newComment.content,
          author_id: newComment.author_id,
          post_id: newComment.post_id,
          parent_id: newComment.parent_id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          profiles: currentUserProfile,
          _optimistic: true,
        }

        return [...old, optimisticComment]
      })

      return { previousComments }
    },
    onSuccess: (result, variables) => {
      if (result?.requiresAuth) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to comment",
          variant: "destructive",
        })
        router.push("/auth/login")
        return
      }

      if (result?.error) {
        toast({
          title: "Failed to Post Comment",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Update cache with real comment data
      if (result?.data) {
        queryClient.setQueryData([...blogKeys.all, "comments", postId], (old: any) => {
          if (!old) return [result.data]

          // Remove optimistic comment and add real one
          const filtered = old.filter((c: any) => !c._optimistic || c.content !== result.data.content)
          return [...filtered, result.data]
        })
      }

      toast({
        title: "Comment Posted",
        description: "Your comment has been added successfully",
      })
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData([...blogKeys.all, "comments", postId], context.previousComments)
      }
      toast({
        title: "Failed to Post Comment",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...blogKeys.all, "comments", postId] })
      queryClient.invalidateQueries({ queryKey: blogKeys.bySlug(postId) })
    },
  })
}

// Update comment mutation
export function useUpdateComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateComment,
    onMutate: async (updatedComment: UpdateCommentInput) => {
      await queryClient.cancelQueries({ queryKey: [...blogKeys.all, "comments", postId] })

      const previousComments = queryClient.getQueryData([...blogKeys.all, "comments", postId])

      queryClient.setQueryData([...blogKeys.all, "comments", postId], (old: any) => {
        if (!old) return old
        return old.map((comment: any) =>
          comment.id === updatedComment.id ? { ...comment, content: updatedComment.content } : comment
        )
      })

      return { previousComments }
    },
    onSuccess: (result) => {
      if (result?.error) {
        toast({
          title: "Failed to Update Comment",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Comment Updated",
        description: "Your comment has been updated successfully",
      })
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData([...blogKeys.all, "comments", postId], context.previousComments)
      }
      toast({
        title: "Failed to Update Comment",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...blogKeys.all, "comments", postId] })
    },
  })
}

// Delete comment mutation
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteComment,
    onMutate: async (commentId: string) => {
      await queryClient.cancelQueries({ queryKey: [...blogKeys.all, "comments", postId] })

      const previousComments = queryClient.getQueryData([...blogKeys.all, "comments", postId])

      queryClient.setQueryData([...blogKeys.all, "comments", postId], (old: any) => {
        if (!old) return old
        return old.filter((comment: any) => comment.id !== commentId)
      })

      return { previousComments }
    },
    onSuccess: (result) => {
      if (result?.error) {
        toast({
          title: "Failed to Delete Comment",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Comment Deleted",
        description: "Your comment has been removed",
      })
    },
    onError: (err, variables, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData([...blogKeys.all, "comments", postId], context.previousComments)
      }
      toast({
        title: "Failed to Delete Comment",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [...blogKeys.all, "comments", postId] })
      queryClient.invalidateQueries({ queryKey: blogKeys.bySlug(postId) })
    },
  })
}
