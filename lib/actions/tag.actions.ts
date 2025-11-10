"use server"

import { createClient } from "../supabase/server"
import { revalidatePath } from "next/cache"

export type Tag = {
  id: string
  name: string
  slug: string
  color: string
  created_at: string
}

// Get all tags
export async function getTags() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching tags:", error)
    return []
  }

  return data as Tag[]
}

// Add tags to a post
export async function addTagsToPost(postId: string, tagIds: string[]) {
  const supabase = await createClient()

  // Remove existing tags
  await supabase.from("post_tags").delete().eq("post_id", postId)

  // Add new tags
  if (tagIds.length > 0) {
    const postTags = tagIds.map((tagId) => ({
      post_id: postId,
      tag_id: tagId,
    }))

    const { error } = await supabase.from("post_tags").insert(postTags)

    if (error) {
      console.error("Error adding tags to post:", error)
      throw new Error(error.message)
    }
  }

  revalidatePath("/")
  return { success: true }
}

// Get tags for a specific post
export async function getPostTags(postId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("post_tags")
    .select(`
      tag_id,
      tags (
        id,
        name,
        slug,
        color,
        created_at
      )
    `)
    .eq("post_id", postId)

  if (error) {
    console.error("Error fetching post tags:", error)
    return []
  }

  return (data?.map((pt: any) => pt.tags).filter(Boolean) || []) as Tag[]
}
