"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Profile } from "@/types/database"

interface ProfileContextType {
  profile: Profile | null
  setProfile: (profile: Profile | null) => void
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ 
  children, 
  initialProfile 
}: { 
  children: ReactNode
  initialProfile: Profile | null 
}) {
  const [profile, setProfile] = useState<Profile | null>(initialProfile)

  return (
    <ProfileContext.Provider value={{ profile, setProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error("useProfile must be used within ProfileProvider")
  }
  return context
}
