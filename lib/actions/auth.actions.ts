"use server"

import { createClient } from "../../lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function signUp(email: string, password: string, username: string) {
    const supabase = await createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (authError) {
        return { error: authError.message }
    }

    // Profile will be created by database trigger after email confirmation
    revalidatePath("/", "layout")
    return { success: true, userId: authData.user?.id }
}

export async function signIn(email: string, password: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath("/", "layout")
    return { success: true }
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath("/", "layout")
    redirect("/")
}

export async function getUser() {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return null
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

        // If profile doesn't exist, create it
        if (!profile) {
            const username = user.user_metadata?.username || user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`

            const { data: newProfile, error: createError } = await supabase
                .from("profiles")
                .insert({
                    id: user.id,
                    username,
                    profile_image: null,
                })
                .select()
                .single()

            if (createError) {
                console.error("Failed to create profile:", createError.message)
                // Return a temporary profile object
                return {
                    id: user.id,
                    username,
                    bio: null,
                    profile_image: null,
                    website_url: null,
                    twitter_url: null,
                    github_url: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                }
            }

            return newProfile
        }

        return profile
    } catch (error) {
        console.error("getUser error:", error)
        return null
    }
}
