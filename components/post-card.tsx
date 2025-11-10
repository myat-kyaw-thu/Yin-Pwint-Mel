"use client"

import type React from "react"
import { memo, useCallback, useMemo } from "react"

import type { Post } from "@/types/database"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageCircle, Bookmark } from "lucide-react"
import { useLikePost, useSavePost } from "@/hooks/use-interactions"
import { TagBadge } from "@/components/tag-badge"

interface PostCardProps {
  post: Post
}

function formatCount(count: number): string {
  if (count > 99) return "99+"
  return count.toString()
}

function PostCardComponent({ post }: PostCardProps) {
  const likeMutation = useLikePost()
  const saveMutation = useSavePost()

  const handleLike = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      likeMutation.mutate({ postId: post.id, isLiked: post.is_liked || false })
    },
    [likeMutation, post.id, post.is_liked]
  )

  const handleSave = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      saveMutation.mutate({ postId: post.id, isSaved: post.is_saved || false })
    },
    [saveMutation, post.id, post.is_saved]
  )

  const formattedDate = useMemo(
    () => formatDistanceToNow(new Date(post.published_at || post.created_at), { addSuffix: true }),
    [post.published_at, post.created_at]
  )

  const likesCountFormatted = useMemo(() => formatCount(post.likes_count || 0), [post.likes_count])
  const commentsCountFormatted = useMemo(() => formatCount(post.comments_count || 0), [post.comments_count])

  return (
    <article className="border border-border p-6 hover:bg-muted/50 transition-colors relative min-h-[200px] flex flex-col">
      <button
        onClick={handleSave}
        disabled={saveMutation.isPending}
        className="absolute top-4 right-4 p-2 hover:bg-muted transition-colors disabled:opacity-50"
        aria-label="Save post"
      >
        <Bookmark
          className={`w-5 h-5 transition-colors ${
            post.is_saved ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
          }`}
        />
      </button>

      <div className="space-y-4 flex-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <time dateTime={post.published_at || post.created_at}>{formattedDate}</time>
        </div>
        <h2 className="text-2xl font-medium tracking-tight leading-tight pr-8">{post.title}</h2>
        {post.excerpt && <p className="text-muted-foreground leading-relaxed">{post.excerpt}</p>}
        
        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} size="sm" />
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 mt-6 pt-6 border-t border-border">
        <button
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className="flex items-center gap-2 hover:bg-muted p-1.5 -ml-1.5 transition-colors disabled:opacity-50"
          aria-label="Like post"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              post.is_liked ? "fill-red-500 text-red-500" : "text-muted-foreground"
            }`}
          />
          <span className="text-[10px] text-muted-foreground font-medium">{likesCountFormatted}</span>
        </button>

        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground font-medium">{commentsCountFormatted}</span>
        </div>
      </div>
    </article>
  )
}

export const PostCard = memo(PostCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.is_liked === nextProps.post.is_liked &&
    prevProps.post.is_saved === nextProps.post.is_saved &&
    prevProps.post.likes_count === nextProps.post.likes_count &&
    prevProps.post.comments_count === nextProps.post.comments_count
  )
})
