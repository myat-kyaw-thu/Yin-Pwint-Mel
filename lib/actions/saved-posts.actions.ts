"use server"

import { createClient } from "../../lib/supabase/server"

// Get user's saved posts
export async function getSavedPosts() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get saved post IDs
  const { data: savedPosts, error: savedError } = await supabase
    .from("saved_posts")
    .select("post_id")
    .eq("user_id", user.id)

  if (savedError) {
    console.error("Error fetching saved posts:", savedError)
    return []
  }

  if (!savedPosts || savedPosts.length === 0) {
    return []
  }

  const postIds = savedPosts.map((sp) => sp.post_id)

  // Get full post details
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select(`
      *,
      profiles!posts_author_id_fkey (
        id,
        username,
        profile_image
      )
    `)
    .in("id", postIds)
    .eq("status", "published")
    .order("created_at", { ascending: false })

  if (postsError) {
    console.error("Error fetching posts:", postsError)
    return []
  }

  // Get user interactions
  let userLikes: string[] = []

  if (posts.length > 0) {
    const { data: likesData } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", user.id)
      .in("post_id", postIds)

    userLikes = likesData?.map((l) => l.post_id) || []
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
        is_saved: true, // All posts here are saved
      }
    })
  )

  return postsWithCounts
}
