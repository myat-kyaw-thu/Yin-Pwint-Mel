"use client"

import type React from "react"
import { useState, useCallback, memo, useMemo } from "react"
import type { Comment } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Edit2, Trash2, X, MessageCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useCreateComment, useUpdateComment, useDeleteComment } from "@/hooks/use-comments"

interface CommentSectionProps {
  postId: string
  comments?: Comment[]
  isLoading?: boolean
  currentUserId?: string
}

export function CommentSection({ postId, comments = [], isLoading = false, currentUserId }: CommentSectionProps) {
  const [commentText, setCommentText] = useState("")
  const createMutation = useCreateComment(postId)

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!commentText.trim() || !currentUserId) return

      createMutation.mutate(
        {
          content: commentText.trim(),
          post_id: postId,
          author_id: currentUserId,
        },
        {
          onSuccess: (result) => {
            if (result?.success) {
              setCommentText("")
            }
          },
        }
      )
    },
    [commentText, postId, currentUserId, createMutation]
  )

  return (
    <div className="space-y-8 pt-8 border-t border-border">
      {/* Comment Input */}
      <div className="space-y-6">
        <h3 className="text-xl font-medium tracking-tight">Comments ({comments.length})</h3>
        {currentUserId ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="rounded-none min-h-24 resize-none"
              disabled={createMutation.isPending}
            />
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={!commentText.trim() || createMutation.isPending}
                className="rounded-none gap-2"
              >
                <Send className="w-4 h-4" />
                {createMutation.isPending ? "Posting..." : "Post Comment"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="border border-border p-6 text-center">
            <p className="text-muted-foreground">Sign in to join the conversation</p>
          </div>
        )}
      </div>

      {/* Comments List */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted w-1/4"></div>
                </div>
              </div>
              <div className="h-4 bg-muted w-full"></div>
              <div className="h-4 bg-muted w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && comments.length > 0 && (
        <div className="space-y-6">
          {comments
            .filter((c) => !c.parent_id)
            .map((comment) => (
              <CommentThread
                key={comment.id}
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
                allComments={comments}
              />
            ))}
        </div>
      )}

      {!isLoading && comments.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </div>
  )
}

interface CommentItemProps {
  comment: Comment
  postId: string
  currentUserId?: string
}

interface CommentThreadProps {
  comment: Comment
  postId: string
  currentUserId?: string
  allComments: Comment[]
}

const CommentThread = memo(({ comment, postId, currentUserId, allComments }: CommentThreadProps) => {
  const replies = useMemo(
    () => allComments.filter((c) => c.parent_id === comment.id).sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    ),
    [allComments, comment.id]
  )

  return (
    <div>
      <CommentItem comment={comment} postId={postId} currentUserId={currentUserId} />
      {replies.length > 0 && (
        <div className="ml-12 mt-4 space-y-4 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              postId={postId}
              currentUserId={currentUserId}
              allComments={allComments}
            />
          ))}
        </div>
      )}
    </div>
  )
})

const CommentItem = memo(
  ({ comment, postId, currentUserId }: CommentItemProps) => {
    const [isEditing, setIsEditing] = useState(false)
    const [isReplying, setIsReplying] = useState(false)
    const [editText, setEditText] = useState(comment.content)
    const [replyText, setReplyText] = useState("")
    const updateMutation = useUpdateComment(postId)
    const deleteMutation = useDeleteComment(postId)
    const createMutation = useCreateComment(postId)

    const isOwner = currentUserId === comment.author_id
    const isOptimistic = (comment as any)._optimistic

    const formattedDate = useMemo(
      () => formatDistanceToNow(new Date(comment.created_at), { addSuffix: true }),
      [comment.created_at]
    )

    const handleUpdate = useCallback(() => {
      if (!editText.trim()) return

      updateMutation.mutate(
        {
          id: comment.id,
          content: editText.trim(),
        },
        {
          onSuccess: (result) => {
            if (result?.success) {
              setIsEditing(false)
            }
          },
        }
      )
    }, [editText, comment.id, updateMutation])

    const handleDelete = useCallback(() => {
      if (confirm("Are you sure you want to delete this comment?")) {
        deleteMutation.mutate(comment.id)
      }
    }, [comment.id, deleteMutation])

    const handleCancelEdit = useCallback(() => {
      setEditText(comment.content)
      setIsEditing(false)
    }, [comment.content])

    const handleReply = useCallback(() => {
      if (!replyText.trim() || !currentUserId) return

      createMutation.mutate(
        {
          content: replyText.trim(),
          post_id: postId,
          author_id: currentUserId,
          parent_id: comment.id,
        },
        {
          onSuccess: (result) => {
            if (result?.success) {
              setReplyText("")
              setIsReplying(false)
            }
          },
        }
      )
    }, [replyText, postId, currentUserId, comment.id, createMutation])

    const handleCancelReply = useCallback(() => {
      setReplyText("")
      setIsReplying(false)
    }, [])

    return (
      <div
        className={`space-y-3 ${
          isOptimistic ? "opacity-60" : ""
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 bg-muted shrink-0"
            style={{
              backgroundImage: comment.profiles?.profile_image
                ? `url(${comment.profiles.profile_image})`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{comment.profiles?.username || "Anonymous"}</span>
              <span className="text-xs text-muted-foreground">{formattedDate}</span>
              {isOptimistic && <span className="text-xs text-muted-foreground italic">Posting...</span>}
            </div>
          </div>
          {isOwner && !isOptimistic && !isEditing && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
                disabled={updateMutation.isPending || deleteMutation.isPending}
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                disabled={updateMutation.isPending || deleteMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="pl-[52px] space-y-3">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="rounded-none min-h-20 resize-none"
              disabled={updateMutation.isPending}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={!editText.trim() || updateMutation.isPending}
                className="rounded-none"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEdit}
                disabled={updateMutation.isPending}
                className="rounded-none"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="pl-[52px] space-y-3">
            <p className="text-sm text-foreground leading-relaxed">{comment.content}</p>
            {currentUserId && !isOptimistic && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsReplying(!isReplying)}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                Reply
              </Button>
            )}
          </div>
        )}

        {isReplying && (
          <div className="pl-[52px] mt-3 space-y-3">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.profiles?.username || "this comment"}...`}
              className="rounded-none min-h-20 resize-none"
              disabled={createMutation.isPending}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={!replyText.trim() || createMutation.isPending}
                className="rounded-none"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {createMutation.isPending ? "Posting..." : "Post Reply"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelReply}
                disabled={createMutation.isPending}
                className="rounded-none"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  },
  (prevProps, nextProps) => {
    return (
      prevProps.comment.id === nextProps.comment.id &&
      prevProps.comment.content === nextProps.comment.content &&
      prevProps.comment.created_at === nextProps.comment.created_at &&
      prevProps.currentUserId === nextProps.currentUserId
    )
  }
)
