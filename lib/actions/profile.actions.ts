"use server"

import { createClient } from "../../lib/supabase/server"
import { revalidatePath } from "next/cache"

export type UpdateProfileInput = {
  username?: string
  bio?: string
  profile_image?: string
  website_url?: string
  twitter_url?: string
  github_url?: string
}

export async function updateProfile(input: UpdateProfileInput) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    console.error("Error updating profile:", error)
    throw new Error(error.message)
  }

  revalidatePath("/", "layout")
  return data
}


