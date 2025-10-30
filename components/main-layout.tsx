"use client"

import { Header } from "@/components/header"
import { ProfileSidebar } from "@/components/profile-sidebar"
import type { Profile } from "@/types/database"
import { memo } from "react"

interface MainLayoutProps {
  profile: Profile | null
  children: React.ReactNode
}

const MemoizedProfileSidebar = memo(ProfileSidebar)

export function MainLayout({ profile, children }: MainLayoutProps) {
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
