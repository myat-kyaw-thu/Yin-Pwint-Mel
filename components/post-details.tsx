"use client"

import { useCallback, useMemo } from "react"
import type { Post } from "@/types/database"
import { Heart, MessageCircle, Bookmark, ArrowLeft, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/comment-section"
import { TagBadge } from "@/components/tag-badge"
import Link from "next/link"

import type { Comment } from "@/types/database"
import { useDeletePost } from "@/hooks/use-blog"
import { useLikePost, useSavePost } from "@/hooks/use-interactions"
import { Edit, Trash2 } from "lucide-react"
import { LexicalContentRenderer } from "@/components/lexical-content-renderer"

interface PostDetailProps {
    post: Post
    comments?: Comment[]
    isLoadingComments?: boolean
    currentUserId?: string
}

export function PostDetail({ post, comments = [], isLoadingComments = false, currentUserId }: PostDetailProps) {
    const deleteMutation = useDeletePost()
    const likeMutation = useLikePost()
    const saveMutation = useSavePost()
    const isOwner = currentUserId === post.author_id

    const handleLike = useCallback(() => {
        likeMutation.mutate({ postId: post.id, isLiked: post.is_liked || false })
    }, [likeMutation, post.id, post.is_liked])

    const handleSave = useCallback(() => {
        saveMutation.mutate({ postId: post.id, isSaved: post.is_saved || false })
    }, [saveMutation, post.id, post.is_saved])

    const handleDelete = useCallback(() => {
        if (confirm("Are you sure you want to delete this post?")) {
            deleteMutation.mutate(post.id)
        }
    }, [deleteMutation, post.id])

    const formatCount = useCallback((count: number) => {
        if (count > 99) return "99+"
        return count.toString()
    }, [])

    const formattedDate = useMemo(
        () =>
            new Date(post.published_at || post.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
            }),
        [post.published_at, post.created_at]
    )

    const likesCountFormatted = useMemo(() => formatCount(post.likes_count || 0), [formatCount, post.likes_count])
    const commentsCountFormatted = useMemo(
        () => formatCount(post.comments_count || 0),
        [formatCount, post.comments_count]
    )

    return (
        <article>
            {/* Back Button and Actions */}
            <div className="mb-8 flex items-center justify-between">
                <Link href="/">
                    <Button variant="ghost" className="rounded-none px-4 py-2 h-auto hover:bg-muted">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to posts
                    </Button>
                </Link>

                {isOwner && (
                    <div className="flex items-center gap-2">
                        <Link href={`/blog/edit/${post.id}`}>
                            <Button variant="outline" size="sm" className="rounded-none gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            size="sm"
                            className="rounded-none gap-2 text-destructive hover:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                )}
            </div>

            {/* Header Section */}
            <div className="space-y-8 mb-12">
                {/* Title */}
                <h1 className="text-4xl font-bold text-foreground leading-tight">{post.title}</h1>

                {/* Meta Information */}
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <div
                            className="h-10 w-10 bg-muted"
                            style={{
                                backgroundImage: post.profiles?.profile_image ? `url(${post.profiles.profile_image})` : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                            }}
                        />
                        <span className="font-medium text-foreground">{post.profiles?.username}</span>
                    </div>
                    <span>{formattedDate}</span>
                    <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>5 min read</span>
                    </div>
                </div>

                {/* Interaction Bar */}
                <div className="flex items-center justify-between pt-8 border-t border-border">
                    <div className="flex items-center gap-6">
                        {/* Like Button */}
                        <button
                            onClick={handleLike}
                            disabled={likeMutation.isPending}
                            className="flex items-center gap-2 group disabled:opacity-50"
                        >
                            <Heart
                                className={`h-5 w-5 transition-colors ${post.is_liked
                                    ? "fill-red-500 text-red-500"
                                    : "text-muted-foreground group-hover:text-foreground"
                                    }`}
                            />
                            <span className="text-xs text-muted-foreground">{likesCountFormatted}</span>
                        </button>

                        {/* Comment Count */}
                        <div className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{commentsCountFormatted}</span>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={saveMutation.isPending}
                        className="p-2 hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <Bookmark
                            className={`h-5 w-5 ${post.is_saved ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                                }`}
                        />
                    </button>
                </div>
            </div>

            {/* Excerpt */}
            {post.excerpt && (
                <div className="mb-8">
                    <p className="text-lg text-muted-foreground leading-relaxed">{post.excerpt}</p>
                </div>
            )}

            {/* Content */}
            <div className="mb-12">
                <LexicalContentRenderer content={post.content} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-12 pb-12 border-b border-border">
                    {post.tags.map((tag) => (
                        <TagBadge key={tag.id} tag={tag} size="md" />
                    ))}
                </div>
            )}

            {/* Comment Section */}
            <CommentSection
                postId={post.id}
                comments={comments}
                isLoading={isLoadingComments}
                currentUserId={currentUserId}
            />
        </article>
    )
}
