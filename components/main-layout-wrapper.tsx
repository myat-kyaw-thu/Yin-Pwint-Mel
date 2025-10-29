"use client"

import { Header } from "@/components/header"
import { ProfileSidebar } from "@/components/profile-sidebar"
import type { Profile } from "@/types/database"
import { memo, useEffect, useState } from "react"

interface MainLayoutWrapperProps {
  profile: Profile | null
  children: React.ReactNode
}

const MemoizedProfileSidebar = memo(
  ProfileSidebar,
  (prevProps, nextProps) => {
    // Only re-render if profile data actually changed
    if (!prevProps.profile && !nextProps.profile) return true
    if (!prevProps.profile || !nextProps.profile) return false

    return (
      prevProps.profile.id === nextProps.profile.id &&
      prevProps.profile.username === nextProps.profile.username &&
      prevProps.profile.bio === nextProps.profile.bio &&
      prevProps.profile.profile_image === nextProps.profile.profile_image &&
      prevProps.profile.website_url === nextProps.profile.website_url &&
      prevProps.profile.twitter_url === nextProps.profile.twitter_url &&
      prevProps.profile.github_url === nextProps.profile.github_url
    )
  }
)

export function MainLayoutWrapper({ profile: initialProfile, children }: MainLayoutWrapperProps) {
  const [profile, setProfile] = useState(initialProfile)

  // Only update profile if it actually changed
  useEffect(() => {
    if (JSON.stringify(initialProfile) !== JSON.stringify(profile)) {
      setProfile(initialProfile)
    }
  }, [initialProfile, profile])

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 pt-28 pb-12">
        <div className="grid grid-cols-12 gap-8">
          <aside className="col-span-12 lg:col-span-4">
            <MemoizedProfileSidebar profile={profile} />
          </aside>
          <div className="col-span-12 lg:col-span-8">{children}</div>
        </div>
      </main>
    </div>
  )
}
