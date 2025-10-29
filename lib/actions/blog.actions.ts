"use server"

import { createClient } from "../../lib/supabase/server"
import { revalidatePath } from "next/cache"

export type BlogPost = {
  id: string
  title: string
  content: any
  excerpt: string | null
  slug: string
  author_id: string
  status: "draft" | "published" | "archived"
  created_at: string
  updated_at: string
  published_at: string | null
}

export type CreatePostInput = {
  title: string
  content: any
  excerpt?: string | null
  slug: string
  author_id: string
  status?: "draft" | "published"
}

export type UpdatePostInput = {
  id: string
  title?: string
  content?: any
  excerpt?: string | null
  slug?: string
  status?: "draft" | "published" | "archived"
  published_at?: string | null
}

// Get all posts with counts (paginated)
export async function getPosts(page: number = 0, pageSize: number = 10) {
  const supabase = await createClient()

  const from = page * pageSize
  const to = from + pageSize - 1

  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_author_id_fkey (
        id,
        username,
        profile_image
      )
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .range(from, to)

  if (error) {
    console.error("Error fetching posts:", error)
    throw new Error(error.message)
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user interactions if logged in
  let userLikes: string[] = []
  let userSaved: string[] = []

  if (user && posts.length > 0) {
    const postIds = posts.map((p) => p.id)
    const [likesResult, savedResult] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
      supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
    ])
    userLikes = likesResult.data?.map((l) => l.post_id) || []
    userSaved = savedResult.data?.map((s) => s.post_id) || []
  }

  // Get counts for each post
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      const [likesResult, commentsResult] = await Promise.all([
        supabase.from("likes").select("user_id", { count: "exact", head: true }).eq("post_id", post.id),
        supabase.from("comments").select("id", { count: "exact", head: true }).eq("post_id", post.id),
      ])

      return {
        ...post,
        likes_count: likesResult.count || 0,
        comments_count: commentsResult.count || 0,
        is_liked: userLikes.includes(post.id),
        is_saved: userSaved.includes(post.id),
      }
    })
  )

  return {
    posts: postsWithCounts,
    hasMore: posts.length === pageSize,
    nextPage: posts.length === pageSize ? page + 1 : undefined,
  }
}

// Get single post by slug with counts
export async function getPostBySlug(slug: string) {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_author_id_fkey (
        id,
        username,
        profile_image,
        bio
      )
    `)
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("Error fetching post:", error)
    return null
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get user interactions if logged in
  let isLiked = false
  let isSaved = false

  if (user) {
    const [likeResult, savedResult] = await Promise.all([
      supabase.from("likes").select("post_id").eq("user_id", user.id).eq("post_id", post.id).maybeSingle(),
      supabase
        .from("saved_posts")
        .select("post_id")
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .maybeSingle(),
    ])
    isLiked = !!likeResult.data
    isSaved = !!savedResult.data
  }

  // Get counts
  const [likesResult, commentsResult] = await Promise.all([
    supabase.from("likes").select("user_id", { count: "exact", head: true }).eq("post_id", post.id),
    supabase.from("comments").select("id", { count: "exact", head: true }).eq("post_id", post.id),
  ])

  return {
    ...post,
    likes_count: likesResult.count || 0,
    comments_count: commentsResult.count || 0,
    is_liked: isLiked,
    is_saved: isSaved,
  }
}

// Get single post by ID
export async function getPostById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching post:", error)
    return null
  }

  return data
}

// Helper function to ensure unique slug
async function ensureUniqueSlug(supabase: any, slug: string, excludeId?: string): Promise<string> {
  let uniqueSlug = slug
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const query = supabase.from("posts").select("id").eq("slug", uniqueSlug)

    // If updating, exclude the current post
    if (excludeId) {
      query.neq("id", excludeId)
    }

    const { data, error } = await query.maybeSingle()

    // If no conflict, slug is unique
    if (!data) {
      return uniqueSlug
    }

    // Generate random 3-digit number
    const randomNum = Math.floor(100 + Math.random() * 900)
    uniqueSlug = `${slug}-${randomNum}`
    attempts++
  }

  // Fallback: use timestamp if all attempts failed
  return `${slug}-${Date.now()}`
}

// Create new post
export async function createPost(input: CreatePostInput) {
  const supabase = await createClient()

  // Ensure slug is unique
  const uniqueSlug = await ensureUniqueSlug(supabase, input.slug)

  const postData = {
    ...input,
    slug: uniqueSlug,
    status: input.status || "draft",
    published_at: input.status === "published" ? new Date().toISOString() : null,
  }

  const { data, error } = await supabase
    .from("posts")
    .insert(postData)
    .select()
    .single()

  if (error) {
    console.error("Error creating post:", error)
    throw new Error(error.message)
  }

  revalidatePath("/")
  return data
}

// Update post
export async function updatePost(input: UpdatePostInput) {
  const supabase = await createClient()

  const { id, ...updateData } = input

  // If slug is being updated, ensure it's unique
  if (updateData.slug) {
    updateData.slug = await ensureUniqueSlug(supabase, updateData.slug, id)
  }

  // If status is being changed to published, set published_at
  if (updateData.status === "published") {
    const { data: existingPost } = await supabase
      .from("posts")
      .select("published_at")
      .eq("id", id)
      .single()

    if (existingPost && !existingPost.published_at) {
      ; (updateData as any).published_at = new Date().toISOString()
    }
  }

  const { data, error } = await supabase
    .from("posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating post:", error)
    throw new Error(error.message)
  }

  revalidatePath("/")
  revalidatePath(`/${data.slug}`)
  return data
}

// Delete post
export async function deletePost(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("posts").delete().eq("id", id)

  if (error) {
    console.error("Error deleting post:", error)
    throw new Error(error.message)
  }

  revalidatePath("/")
  return { success: true }
}

// Get comments for a post (including all replies)
export async function getCommentsByPostId(postId: string) {
  const supabase = await createClient()

  // Fetch ALL comments for this post (including replies)
  const { data, error } = await supabase
    .from("comments")
    .select(`
      *,
      profiles!comments_author_id_fkey (
        id,
        username,
        profile_image
      )
    `)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching comments:", error)
    throw new Error(error.message)
  }

  return data
}


