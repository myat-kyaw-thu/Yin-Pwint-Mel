"use server"

import { createClient } from "../../lib/supabase/server"
import { revalidatePath } from "next/cache"

// Like a post
export async function likePost(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication required", requiresAuth: true }
  }

  const { error } = await supabase
    .from("likes")
    .insert({ user_id: user.id, post_id: postId })

  if (error) {
    console.error("Error liking post:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  revalidatePath(`/[slug]`)
  return { success: true }
}

// Unlike a post
export async function unlikePost(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication required", requiresAuth: true }
  }

  const { error } = await supabase
    .from("likes")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId)

  if (error) {
    console.error("Error unliking post:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  revalidatePath(`/[slug]`)
  return { success: true }
}

// Save a post
export async function savePost(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication required", requiresAuth: true }
  }

  const { error } = await supabase
    .from("saved_posts")
    .insert({ user_id: user.id, post_id: postId })

  if (error) {
    console.error("Error saving post:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  revalidatePath(`/[slug]`)
  return { success: true }
}

// Unsave a post
export async function unsavePost(postId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication required", requiresAuth: true }
  }

  const { error } = await supabase
    .from("saved_posts")
    .delete()
    .eq("user_id", user.id)
    .eq("post_id", postId)

  if (error) {
    console.error("Error unsaving post:", error)
    return { error: error.message }
  }

  revalidatePath("/")
  revalidatePath(`/[slug]`)
  return { success: true }
}

// Check if user liked/saved posts
export async function getUserInteractions(postIds: string[]) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || postIds.length === 0) {
    return { likes: [], saved: [] }
  }

  const [likesResult, savedResult] = await Promise.all([
    supabase.from("likes").select("post_id").eq("user_id", user.id).in("post_id", postIds),
    supabase.from("saved_posts").select("post_id").eq("user_id", user.id).in("post_id", postIds),
  ])

  return {
    likes: likesResult.data?.map((l) => l.post_id) || [],
    saved: savedResult.data?.map((s) => s.post_id) || [],
  }
}
