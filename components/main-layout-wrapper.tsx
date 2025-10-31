"use client"

import { Header } from "@/components/header"
import { ProfileSidebar } from "@/components/profile-sidebar"
import { memo } from "react"
import { useProfile } from "@/providers/profile-provider"

interface MainLayoutWrapperProps {
  children: React.ReactNode
}

// Deep comparison for profile to handle reference changes
const MemoizedProfileSidebar = memo(
  ProfileSidebar,
  (prevProps, nextProps) => {
    // Handle null cases
    if (!prevProps.profile && !nextProps.profile) return true
    if (!prevProps.profile || !nextProps.profile) return false
    
    // Deep comparison of profile fields
    return JSON.stringify(prevProps.profile) === JSON.stringify(nextProps.profile)
  }
)

export function MainLayoutWrapper({ children }: MainLayoutWrapperProps) {
  const { profile } = useProfile()

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
