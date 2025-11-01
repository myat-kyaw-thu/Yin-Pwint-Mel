"use server"

import { createClient } from "../../lib/supabase/server"
import { revalidatePath } from "next/cache"

export type CreateCommentInput = {
  content: string
  post_id: string
  author_id: string
  parent_id?: string | null
}

export type UpdateCommentInput = {
  id: string
  content: string
}

// Create comment
export async function createComment(input: CreateCommentInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication required", requiresAuth: true }
  }

  if (user.id !== input.author_id) {
    return { error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      content: input.content,
      post_id: input.post_id,
      author_id: input.author_id,
      parent_id: input.parent_id || null,
    })
    .select(`
      *,
      profiles!comments_author_id_fkey (
        id,
        username,
        profile_image
      )
    `)
    .single()

  if (error) {
    console.error("Error creating comment:", error)
    return { error: error.message }
  }

  revalidatePath("/[slug]")
  return { success: true, data }
}

// Update comment
export async function updateComment(input: UpdateCommentInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication required", requiresAuth: true }
  }

  // Check ownership
  const { data: existingComment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", input.id)
    .single()

  if (!existingComment || existingComment.author_id !== user.id) {
    return { error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("comments")
    .update({ content: input.content })
    .eq("id", input.id)
    .select(`
      *,
      profiles!comments_author_id_fkey (
        id,
        username,
        profile_image
      )
    `)
    .single()

  if (error) {
    console.error("Error updating comment:", error)
    return { error: error.message }
  }

  revalidatePath("/[slug]")
  return { success: true, data }
}

// Delete comment
export async function deleteComment(id: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Authentication required", requiresAuth: true }
  }

  // Check ownership
  const { data: existingComment } = await supabase
    .from("comments")
    .select("author_id")
    .eq("id", id)
    .single()

  if (!existingComment || existingComment.author_id !== user.id) {
    return { error: "Unauthorized" }
  }

  const { error } = await supabase.from("comments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting comment:", error)
    return { error: error.message }
  }

  revalidatePath("/[slug]")
  return { success: true }
}
