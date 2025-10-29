"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RichEditor } from "@/components/rich-editor"
import { useCreatePost, useUpdatePost } from "@/hooks/use-blog"
import { generateSlug } from "@/lib/utils/slug"
import type { BlogPost } from "@/lib/actions/blog.actions"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface BlogFormProps {
  post?: BlogPost
  authorId: string
}

export function BlogForm({ post, authorId }: BlogFormProps) {
  const isEditing = !!post

  const [title, setTitle] = useState(post?.title || "")
  const [slug, setSlug] = useState(post?.slug || "")
  const [excerpt, setExcerpt] = useState(post?.excerpt || "")
  const [content, setContent] = useState(post?.content || "")
  const [status, setStatus] = useState<"draft" | "published">(
    (post?.status as "draft" | "published") || "draft"
  )
  const [autoSlug, setAutoSlug] = useState(!isEditing)

  const createMutation = useCreatePost()
  const updateMutation = useUpdatePost()

  const isLoading = createMutation.isPending || updateMutation.isPending

  // Auto-generate slug from title
  useEffect(() => {
    if (autoSlug && title) {
      setSlug(generateSlug(title))
    }
  }, [title, autoSlug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !slug.trim()) {
      alert("Title and slug are required")
      return
    }

    const postData = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content,
      status,
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({
          id: post.id,
          ...postData,
        })
      } else {
        await createMutation.mutateAsync({
          ...postData,
          author_id: authorId,
        })
      }
    } catch (error) {
      console.error("Error saving post:", error)
      alert("Failed to save post. Please try again.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="rounded-none px-4 py-2 h-auto hover:bg-muted">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to posts
          </Button>
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {isEditing ? "Edit Post" : "Create New Post"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            className="rounded-none text-lg"
            required
          />
        </div>

        {/* Slug */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="slug">Slug *</Label>
            <button
              type="button"
              onClick={() => setAutoSlug(!autoSlug)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {autoSlug ? "Manual edit" : "Auto-generate"}
            </button>
          </div>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setAutoSlug(false)
            }}
            placeholder="post-url-slug"
            className="rounded-none font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground">
            URL: /{slug || "post-url-slug"}
          </p>
        </div>

        {/* Excerpt */}
        <div className="space-y-2">
          <Label htmlFor="excerpt">Excerpt</Label>
          <Textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Brief description of your post..."
            className="rounded-none min-h-24"
          />
        </div>

        {/* Content */}
        <div className="space-y-2">
          <Label>Content *</Label>
          <RichEditor value={content} onChange={setContent} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-6 border-t border-border">
          <Button
            type="submit"
            onClick={() => setStatus("published")}
            disabled={isLoading}
            className="rounded-none"
          >
            {isLoading ? "Saving..." : isEditing ? "Update & Publish" : "Publish"}
          </Button>

          <Button
            type="submit"
            variant="outline"
            onClick={() => setStatus("draft")}
            disabled={isLoading}
            className="rounded-none"
          >
            {isLoading ? "Saving..." : "Save as Draft"}
          </Button>

          <Link href="/">
            <Button type="button" variant="ghost" className="rounded-none">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
