"use client"

import { PostDetail } from "@/components/post-details"
import { useComments } from "@/hooks/use-blog"

interface PostDetailContainerProps {
  post: any
  currentUserId?: string
}

export function PostDetailContainer({ post, currentUserId }: PostDetailContainerProps) {
  const { data: comments, isLoading } = useComments(post.id)

  return (
    <PostDetail
      post={post}
      comments={comments || []}
      isLoadingComments={isLoading}
      currentUserId={currentUserId}
    />
  )
}
