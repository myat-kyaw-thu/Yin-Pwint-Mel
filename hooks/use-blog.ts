import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query"
import {
  getPosts,
  getPostBySlug,
  getPostById,
  getCommentsByPostId,
  createPost,
  updatePost,
  deletePost,
  type CreatePostInput,
  type UpdatePostInput,
} from "@/lib/actions/blog.actions"
import { useRouter } from "next/navigation"

// Query keys
export const blogKeys = {
  all: ["posts"] as const,
  lists: () => [...blogKeys.all, "list"] as const,
  list: (filters: string) => [...blogKeys.lists(), { filters }] as const,
  details: () => [...blogKeys.all, "detail"] as const,
  detail: (id: string) => [...blogKeys.details(), id] as const,
  bySlug: (slug: string) => [...blogKeys.all, "slug", slug] as const,
}

// Get all posts with infinite scroll
export function usePosts() {
  return useInfiniteQuery({
    queryKey: blogKeys.lists(),
    queryFn: ({ pageParam = 0 }) => getPosts(pageParam, 10),
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  })
}

// Get post by slug
export function usePostBySlug(slug: string) {
  return useQuery({
    queryKey: blogKeys.bySlug(slug),
    queryFn: () => getPostBySlug(slug),
    enabled: !!slug,
  })
}

// Get post by ID
export function usePostById(id: string) {
  return useQuery({
    queryKey: blogKeys.detail(id),
    queryFn: () => getPostById(id),
    enabled: !!id,
  })
}

// Get comments for a post
export function useComments(postId: string) {
  return useQuery({
    queryKey: [...blogKeys.all, "comments", postId] as const,
    queryFn: () => getCommentsByPostId(postId),
    enabled: !!postId,
  })
}

// Create post mutation
export function useCreatePost() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: createPost,
    onSuccess: (data) => {
      // Invalidate and refetch posts list
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() })

      // Redirect to the new post
      router.push(`/${data.slug}`)
    },
    onError: (error) => {
      console.error("Failed to create post:", error)
    },
  })
}

// Update post mutation
export function useUpdatePost() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: updatePost,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: blogKeys.detail(variables.id) })

      // Snapshot previous value
      const previousPost = queryClient.getQueryData(blogKeys.detail(variables.id))

      // Optimistically update
      queryClient.setQueryData(blogKeys.detail(variables.id), (old: any) => ({
        ...old,
        ...variables,
      }))

      return { previousPost }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousPost) {
        queryClient.setQueryData(blogKeys.detail(variables.id), context.previousPost)
      }
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() })
      queryClient.invalidateQueries({ queryKey: blogKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: blogKeys.bySlug(data.slug) })

      // Redirect if slug changed
      router.push(`/${data.slug}`)
    },
  })
}

// Delete post mutation
export function useDeletePost() {
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      // Invalidate posts list
      queryClient.invalidateQueries({ queryKey: blogKeys.lists() })

      // Redirect to home
      router.push("/")
    },
    onError: (error) => {
      console.error("Failed to delete post:", error)
    },
  })
}
